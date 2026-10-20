"use client";

import { useState } from "react";

// Ventana que pide el link del video antes de pasar un proyecto a Editado o Publicado
export default function LinkPrompt({ nextLabel, onConfirm, onCancel }) {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const value = link.trim();

    if (!/^https?:\/\/\S+\.\S+/.test(value)) {
      setError("Pegá un link válido que empiece con http:// o https://");
      return;
    }

    setSaving(true);
    setError("");
    const message = await onConfirm(value);

    // onConfirm devuelve un texto de error, o nada si salió bien
    if (message) {
      setError(message);
      setSaving(false);
    }
  }

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <form
        className="confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        noValidate
      >
        <h3 id="link-title">Link del video</h3>
        <p className="muted">
          Pegá el link del video editado para marcar este proyecto como{" "}
          {nextLabel}.
        </p>

        <input
          className="prompt-input"
          type="url"
          placeholder="https://"
          autoFocus
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <div className="confirm-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
