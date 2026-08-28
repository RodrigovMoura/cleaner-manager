/**
 * Validation and sanitization utilities for authentication and user inputs.
 * Ensures security against malformed data, script/command injection, and DoS attacks.
 */

// Basic malicious pattern detectors
const DANGEROUS_CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;
const HTML_OR_SCRIPT_REGEX = /<[^>]*>|javascript:|data:\s*text\/html/i;
const SQL_OR_SHELL_INJECTION_TOKENS = /(--|\b(UNION\s+SELECT|DROP\s+TABLE|INSERT\s+INTO|DELETE\s+FROM)\b|;|\||`|\$\(.*?\))/i;

// Strict RFC-compliant email regex: user@domain.tld
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Valid name characters: unicode letters, spaces, hyphens, periods, and apostrophes
const VALID_NAME_REGEX = /^[\p{L}\p{M}'\s\-.]+$/u;

// Valid phone characters: digits, spaces, parentheses, hyphens, periods, and plus sign prefix
const VALID_PHONE_REGEX = /^\+?[0-9\s().-]+$/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface RegistrationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

export interface ClientErrors {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  reminderDaysBefore?: string;
  autoSendInvoice?: string;
  form?: string;
}

/**
 * Sanitizes a string input by removing control characters and leading/trailing whitespace.
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== "string") {
    return "";
  }
  // Remove control characters (including null bytes)
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
}

/**
 * Validates a user's display name or client name.
 */
export function validateName(name: unknown): ValidationResult {
  if (typeof name !== "string" || name.trim().length === 0) {
    return { isValid: false, error: "Name is required." };
  }

  const trimmed = name.trim();

  if (DANGEROUS_CONTROL_CHARS_REGEX.test(name)) {
    return { isValid: false, error: "Name contains invalid or malicious characters." };
  }

  if (HTML_OR_SCRIPT_REGEX.test(name)) {
    return { isValid: false, error: "Name cannot contain HTML or script code." };
  }

  if (SQL_OR_SHELL_INJECTION_TOKENS.test(name)) {
    return { isValid: false, error: "Name contains invalid characters or command patterns." };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: "Name must be at least 2 characters long." };
  }

  if (trimmed.length > 70) {
    return { isValid: false, error: "Name must not exceed 70 characters." };
  }

  if (!VALID_NAME_REGEX.test(trimmed)) {
    return { isValid: false, error: "Name contains unsupported special characters." };
  }

  return { isValid: true };
}

/**
 * Validates an email address for format, length, and malicious payload patterns.
 */
export function validateEmail(email: unknown): ValidationResult {
  if (typeof email !== "string" || email.trim().length === 0) {
    return { isValid: false, error: "Email is required." };
  }

  const trimmed = email.trim().toLowerCase();

  if (DANGEROUS_CONTROL_CHARS_REGEX.test(email)) {
    return { isValid: false, error: "Email contains invalid control characters." };
  }

  if (HTML_OR_SCRIPT_REGEX.test(email)) {
    return { isValid: false, error: "Email cannot contain HTML or script injection." };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: "Email exceeds maximum allowed length (254 characters)." };
  }

  // Prevent consecutive dots or spaces
  if (trimmed.includes("..") || trimmed.includes(" ") || trimmed.startsWith(".") || trimmed.endsWith(".")) {
    return { isValid: false, error: "Email has an invalid structure." };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: "Please provide a valid email address (e.g. name@example.com)." };
  }

  // Ensure TLD is at least 2 letters
  const parts = trimmed.split("@");
  if (parts.length !== 2) {
    return { isValid: false, error: "Invalid email format." };
  }

  const domain = parts[1];
  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];

  if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return { isValid: false, error: "Email must have a valid top-level domain (e.g. .com, .com.br)." };
  }

  return { isValid: true };
}

/**
 * Validates a client contact phone number.
 */
export function validatePhone(phone: unknown, required: boolean = true): ValidationResult {
  if (typeof phone !== "string" || phone.trim().length === 0) {
    if (required) {
      return { isValid: false, error: "Phone number is required." };
    }
    return { isValid: true };
  }

  const trimmed = phone.trim();

  if (DANGEROUS_CONTROL_CHARS_REGEX.test(phone)) {
    return { isValid: false, error: "Phone number contains invalid control characters." };
  }

  if (HTML_OR_SCRIPT_REGEX.test(phone) || SQL_OR_SHELL_INJECTION_TOKENS.test(phone)) {
    return { isValid: false, error: "Phone number contains invalid characters." };
  }

  if (!VALID_PHONE_REGEX.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid phone number (digits, spaces, hyphens, or +)." };
  }

  const digitsOnly = trimmed.replace(/\D/g, "");

  if (digitsOnly.length < 8) {
    return { isValid: false, error: "Phone number must have at least 8 digits." };
  }

  if (digitsOnly.length > 15) {
    return { isValid: false, error: "Phone number cannot exceed 15 digits." };
  }

  return { isValid: true };
}

/**
 * Validates a property address.
 */
export function validateAddress(address: unknown): ValidationResult {
  if (typeof address !== "string" || address.trim().length === 0) {
    return { isValid: false, error: "Property address is required." };
  }

  const trimmed = address.trim();

  if (DANGEROUS_CONTROL_CHARS_REGEX.test(address)) {
    return { isValid: false, error: "Address contains invalid control characters." };
  }

  if (HTML_OR_SCRIPT_REGEX.test(address) || SQL_OR_SHELL_INJECTION_TOKENS.test(address)) {
    return { isValid: false, error: "Address cannot contain scripts or command injections." };
  }

  if (trimmed.length < 5) {
    return { isValid: false, error: "Property address must be at least 5 characters long." };
  }

  if (trimmed.length > 200) {
    return { isValid: false, error: "Property address must not exceed 200 characters." };
  }

  return { isValid: true };
}

/**
 * Validates password strength and security boundaries.
 */
export function validatePassword(password: unknown): ValidationResult {
  if (typeof password !== "string" || password.length === 0) {
    return { isValid: false, error: "Password is required." };
  }

  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long." };
  }

  // Prevent bcrypt DoS via very large inputs
  if (password.length > 128) {
    return { isValid: false, error: "Password must not exceed 128 characters." };
  }

  if (DANGEROUS_CONTROL_CHARS_REGEX.test(password)) {
    return { isValid: false, error: "Password contains invalid control characters." };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);

  if (!hasUpper) {
    return { isValid: false, error: "Password must contain at least one uppercase letter (A-Z)." };
  }

  if (!hasLower) {
    return { isValid: false, error: "Password must contain at least one lowercase letter (a-z)." };
  }

  if (!hasNumber) {
    return { isValid: false, error: "Password must contain at least one number (0-9)." };
  }

  if (!hasSpecial) {
    return { isValid: false, error: "Password must contain at least one special character (e.g. !@#$%^&*)." };
  }

  return { isValid: true };
}

/**
 * Checks if an email is authorized in the allowlist.
 * If ALLOWED_REGISTRATION_EMAILS is not set or empty, all valid emails are allowed.
 */
export function isEmailAuthorized(
  email: string,
  rawAllowedList: string | undefined = process.env.ALLOWED_REGISTRATION_EMAILS
): boolean {
  if (!rawAllowedList || rawAllowedList.trim() === "") {
    return true; // No restriction active
  }

  const allowedList = rawAllowedList
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedList.length === 0) {
    return true;
  }

  const normalizedEmail = email.trim().toLowerCase();
  return allowedList.includes(normalizedEmail);
}

/**
 * Comprehensive registration form validation.
 */
export function validateRegistrationData(data: {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
}): { isValid: boolean; errors: RegistrationErrors } {
  const errors: RegistrationErrors = {};

  const nameVal = validateName(data.name);
  if (!nameVal.isValid) {
    errors.name = nameVal.error;
  }

  const emailVal = validateEmail(data.email);
  if (!emailVal.isValid) {
    errors.email = emailVal.error;
  }

  const passwordVal = validatePassword(data.password);
  if (!passwordVal.isValid) {
    errors.password = passwordVal.error;
  }

  if (typeof data.confirmPassword !== "undefined") {
    if (!data.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Comprehensive client form validation (creation and edition).
 */
export function validateClientData(data: {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  address?: unknown;
  reminderDaysBefore?: unknown;
  enableInvoice?: unknown;
  autoSendInvoice?: unknown;
  enableAppointmentReminder?: unknown;
  enablePaymentReminder?: unknown;
}): { isValid: boolean; errors: ClientErrors } {
  const errors: ClientErrors = {};

  // Name validation
  const nameVal = validateName(data.name);
  if (!nameVal.isValid) {
    errors.name = nameVal.error;
  }

  // Phone validation
  const phoneVal = validatePhone(data.phone, true);
  if (!phoneVal.isValid) {
    errors.phone = phoneVal.error;
  }

  // Email validation (optional unless autoSendInvoice is true)
  const isAutoSend = data.autoSendInvoice === true || data.autoSendInvoice === "on";
  const hasEmail = typeof data.email === "string" && data.email.trim().length > 0;

  if (hasEmail) {
    const emailVal = validateEmail(data.email);
    if (!emailVal.isValid) {
      errors.email = emailVal.error;
    }
  } else if (isAutoSend) {
    errors.email = "Email is required when automatic invoice delivery is enabled.";
  }

  // Address validation
  const addressVal = validateAddress(data.address);
  if (!addressVal.isValid) {
    errors.address = addressVal.error;
  }

  // Reminder days validation
  if (data.reminderDaysBefore !== undefined && data.reminderDaysBefore !== null) {
    const days = parseInt(String(data.reminderDaysBefore), 10);
    if (isNaN(days) || days < 1 || days > 7) {
      errors.reminderDaysBefore = "Reminder days must be between 1 and 7.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
