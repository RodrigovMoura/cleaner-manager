"use client";

import { registerUser } from "@/actions/auth";
import { useState } from "react";
import styles from "./page.module.css"; // Import CSS module for styling

export default function RegisterPage() {
  const [error, setError] = useState<null | string>(null);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);

    const result = await registerUser(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Register</h1>
      <p className={styles.description}>Create your customer management account.</p>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor='name' className={styles.label}>
            First name
          </label>
          <input type='name' id='name' name='name' required className={styles.input} />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='email' className={styles.label}>
            Email
          </label>
          <input type='email' id='email' name='email' required className={styles.input} />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='password' className={styles.label}>
            Password
          </label>
          <input type='password' id='password' name='password' required className={styles.input} />
        </div>

        <button type='submit' className={styles.button}>
          Register
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
