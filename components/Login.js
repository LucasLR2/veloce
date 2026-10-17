"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "@/components/Icons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Completá tu email y tu contraseña.");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) setError("Email o contraseña incorrectos.");
    setLoading(false);
  }

  return (
    <main className="center login-page">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <div className="login-head">
          <h1 className="logo big">Veloce</h1>
          <p className="muted">Tu contenido, organizado</p>
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="input-icon">
            <MailIcon />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <div className="input-icon">
            <LockIcon />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="eye"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <button className="btn primary block" type="submit" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
