import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

function collectSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (
      entry.isFile() &&
      /\.(ts|tsx)$/.test(entry.name) &&
      !/\.(test|spec)\.(ts|tsx)$/.test(entry.name)
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function hasUseServerDirective(sourceFile: ts.SourceFile): boolean {
  for (const stmt of sourceFile.statements) {
    if (
      ts.isExpressionStatement(stmt) &&
      ts.isStringLiteral(stmt.expression) &&
      stmt.expression.text === "use server"
    ) {
      return true;
    }
    // Directives only appear at the top of a file before non-directive statements
    break;
  }
  return false;
}

function hasExportModifier(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  const modifiers = ts.getModifiers(node);
  return Boolean(modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword));
}

function hasAsyncModifier(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  const modifiers = ts.getModifiers(node);
  return Boolean(modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword));
}

export function validateUseServerFileExports(
  content: string,
  fileName = "module.ts",
): string[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    content,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  if (!hasUseServerDirective(sourceFile)) {
    return [];
  }

  const errors: string[] = [];

  for (const stmt of sourceFile.statements) {
    // Allow `export type ...` and `export interface ...`
    if (ts.isTypeAliasDeclaration(stmt) || ts.isInterfaceDeclaration(stmt)) {
      continue;
    }

    if (ts.isFunctionDeclaration(stmt) && hasExportModifier(stmt)) {
      const fnName = stmt.name?.text ?? "<anonymous>";
      if (!hasAsyncModifier(stmt)) {
        errors.push(
          `${fileName}: Exported function "${fnName}" in a "use server" file must be async.`,
        );
      }
      continue;
    }

    if (ts.isVariableStatement(stmt) && hasExportModifier(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        const varName = decl.name.getText(sourceFile);
        const init = decl.initializer;
        const isAsyncFn =
          init &&
          (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) &&
          hasAsyncModifier(init);

        if (!isAsyncFn) {
          errors.push(
            `${fileName}: Exported value "${varName}" in a "use server" file is not allowed (only async functions and types may be exported).`,
          );
        }
      }
      continue;
    }

    if (
      (ts.isClassDeclaration(stmt) || ts.isEnumDeclaration(stmt)) &&
      hasExportModifier(stmt)
    ) {
      const name = stmt.name?.text ?? "<anonymous>";
      errors.push(
        `${fileName}: Exported class/enum "${name}" in a "use server" file is not allowed.`,
      );
      continue;
    }

    if (ts.isExportAssignment(stmt)) {
      errors.push(
        `${fileName}: Default export in a "use server" file should be avoided; use named export async functions.`,
      );
      continue;
    }

    if (ts.isExportDeclaration(stmt) && !stmt.isTypeOnly) {
      errors.push(
        `${fileName}: Value re-exports in a "use server" file are not allowed (use "export type" for types).`,
      );
    }
  }

  return errors;
}

describe('Next.js "use server" module export rules', () => {
  it('ensures all files with "use server" in src/ only export async functions and types', () => {
    const srcDir = path.resolve(process.cwd(), "src");
    const allFiles = collectSourceFiles(srcDir);

    const violations: string[] = [];
    let useServerFilesCount = 0;

    for (const filePath of allFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      const relPath = path.relative(process.cwd(), filePath);
      const sourceFile = ts.createSourceFile(
        relPath,
        content,
        ts.ScriptTarget.Latest,
        true,
      );

      if (hasUseServerDirective(sourceFile)) {
        useServerFilesCount++;
        violations.push(...validateUseServerFileExports(content, relPath));
      }
    }

    expect(useServerFilesCount).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });

  it("detects synchronous exported functions and constants in a 'use server' module", () => {
    const invalidCode = `
      "use server";
      export type ValidType = string;
      export async function validAction() {}
      export function syncHelper() { return 1; }
      export const SOME_CONST = 42;
    `;

    const errors = validateUseServerFileExports(invalidCode, "src/actions/example.ts");
    expect(errors).toEqual([
      'src/actions/example.ts: Exported function "syncHelper" in a "use server" file must be async.',
      'src/actions/example.ts: Exported value "SOME_CONST" in a "use server" file is not allowed (only async functions and types may be exported).',
    ]);
  });
});
