"use client";

import { registerUser } from "@/actions/auth";
import { useState } from "react";
import styles from "./page.module.css";
import {
  validateName,
  validateEmail,
  validatePassword,
  validateRegistrationData,
  RegistrationErrors,
} from "@/lib/validation";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<RegistrationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleInputChange(field: keyof typeof formData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear specific field error on change if it exists
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }

    if (serverError) {
      setServerError(null);
    }
  }

  function handleBlur(field: keyof typeof formData) {
    const value = formData[field];

    if (field === "name" && value.trim()) {
      const res = validateName(value);
      if (!res.isValid) {
        setFieldErrors((prev) => ({ ...prev, name: res.error }));
      }
    } else if (field === "email" && value.trim()) {
      const res = validateEmail(value);
      if (!res.isValid) {
        setFieldErrors((prev) => ({ ...prev, email: res.error }));
      }
    } else if (field === "password" && value) {
      const res = validatePassword(value);
      if (!res.isValid) {
        setFieldErrors((prev) => ({ ...prev, password: res.error }));
      }
    } else if (field === "confirmPassword" && value) {
      if (value !== formData.password) {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match." }));
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    // Client-side validation
    const validation = validateRegistrationData({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = new FormData();
      submissionData.append("name", formData.name.trim());
      submissionData.append("email", formData.email.trim().toLowerCase());
      submissionData.append("password", formData.password);
      submissionData.append("confirmPassword", formData.confirmPassword);

      const result = await registerUser(submissionData);

      if (result && (!result.success || result.error)) {
        setServerError(result.error || result.message || "Registration failed. Please check your data.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Register</h1>
      <p className={styles.description}>Create your cleaner management account.</p>

      {/* Restricted Access / Authorized Email Notice */}
      <div className={styles.notice} role='note' aria-label='Registration access notice'>
        <span className={styles.noticeIcon} aria-hidden='true'>
          ⚠️
        </span>
        <div>
          <strong>Notice:</strong> Only authorized emails can register an account on this platform. If your email is not
          in the whitelist, registration will be restricted.
        </div>
      </div>

      {serverError && (
        <div className={styles.error} role='alert' aria-live='assertive'>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.inputGroup}>
          <label htmlFor='name' className={styles.label}>
            Full Name
          </label>
          <input
            type='text'
            id='name'
            name='name'
            required
            autoComplete='name'
            maxLength={70}
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            className={`${styles.input} ${fieldErrors.name ? styles.inputError : ""}`}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
            placeholder='e.g. John Doe'
          />
          {fieldErrors.name && (
            <p id='name-error' className={styles.fieldError}>
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='email' className={styles.label}>
            Email
          </label>
          <input
            type='email'
            id='email'
            name='email'
            required
            autoComplete='email'
            maxLength={254}
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            className={`${styles.input} ${fieldErrors.email ? styles.inputError : ""}`}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            placeholder='name@example.com'
          />
          {fieldErrors.email && (
            <p id='email-error' className={styles.fieldError}>
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='password' className={styles.label}>
            Password
          </label>
          <input
            type='password'
            id='password'
            name='password'
            required
            autoComplete='new-password'
            maxLength={128}
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            onBlur={() => handleBlur("password")}
            className={`${styles.input} ${fieldErrors.password ? styles.inputError : ""}`}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
            placeholder='••••••••'
          />
          {fieldErrors.password ? (
            <p id='password-error' className={styles.fieldError}>
              {fieldErrors.password}
            </p>
          ) : (
            <p id='password-hint' className={styles.hint}>
              Must be at least 8 characters with uppercase, lowercase, number, and special character.
            </p>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='confirmPassword' className={styles.label}>
            Confirm Password
          </label>
          <input
            type='password'
            id='confirmPassword'
            name='confirmPassword'
            required
            autoComplete='new-password'
            maxLength={128}
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            onBlur={() => handleBlur("confirmPassword")}
            className={`${styles.input} ${fieldErrors.confirmPassword ? styles.inputError : ""}`}
            aria-invalid={Boolean(fieldErrors.confirmPassword)}
            aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
            placeholder='••••••••'
          />
          {fieldErrors.confirmPassword && (
            <p id='confirmPassword-error' className={styles.fieldError}>
              {fieldErrors.confirmPassword}
            </p>
          )}
        </div>

        <button type='submit' className={styles.button} disabled={isSubmitting}>
          {isSubmitting ? "Registering..." : "Register"}
        </button>
      </form>

      <p className={styles.linkContainer}>
        Already have an account?{" "}
        <a href='/login' className={styles.link}>
          Login
        </a>
      </p>
    </div>
  );
}
