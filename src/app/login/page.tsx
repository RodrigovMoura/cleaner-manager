"use client";

import { loginUser } from "@/actions/auth";
import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState<null | string>(null);
  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    const result = await loginUser(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div>
      <h1>Login</h1>
      <p>Access your customer management account.</p>
      {error && <div style={{ color: "red" }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor='email'>Email</label>
          <input type='email' id='email' name='email' required />
        </div>

        <div>
          <label htmlFor='password'>Password</label>
          <input type='password' id='password' name='password' required />
        </div>

        <button type='submit'>Login</button>
      </form>

      <p>
        Don&apos;t have an account? <a href='/register'>Register</a>
      </p>
    </div>
  );
}
