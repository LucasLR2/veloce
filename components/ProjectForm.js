"use client";

import { useState } from "react";
import { STATUSES } from "@/lib/helpers";
import { CloseIcon, CopyIcon } from "@/components/Icons";

// initial: proyecto existente (con id) o valores para uno nuevo (sin id)
export default function ProjectForm({ initial, onSave, onDelete, onClose }) {
  const isNew = !initial.id;

  const [phrase, setPhrase] = useState(initial.phrase || "");
  const [publishDate, setPublishDate] = useState(initial.publish_date || "");
  const [status, setStatus] = useState(initial.status || "pendiente");
  const [description, setDescription] = useState(initial.description || "");
  const [videoUrl, setVideoUrl] = useState(initial.video_url || "");
  const [occasion, setOccasion] = useState(initial.occasion || "");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const message = await onSave({
      phrase: phrase.trim(),
      publish_date: publishDate,
      status,
      description: description.trim() || null,
      video_url: videoUrl.trim() || null,
      occasion: occasion.trim() || null,
    });

    // onSave devuelve un texto de error, o nada si salió bien
    if (message) {
      setError(message);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("¿Borrar este proyecto? No se puede deshacer.")) return;
    setSaving(true);
    const message = await onDelete();
    if (message) {
      setError(message);
      setSaving(false);
    }
  }

  async function copyPhrase() {
    try {
      await navigator.clipboard.writeText(phrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("No se pudo copiar la frase.");
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="sheet-head">
          <h2>{isNew ? "Nuevo proyecto" : "Editar proyecto"}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="field">
          <label htmlFor="phrase">Frase del día</label>
          <textarea
            id="phrase"
            rows={3}
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            required
          />
          <button
            type="button"
            className="btn ghost small"
            onClick={copyPhrase}
            disabled={!phrase}
          >
            <CopyIcon width={16} height={16} />
            {copied ? "Copiada" : "Copiar frase"}
          </button>
        </div>

        <div className="row2">
          <div className="field">
            <label htmlFor="date">Fecha de publicación</label>
            <input
              id="date"
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="status">Estado</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="occasion">Ocasión (opcional)</label>
          <input
            id="occasion"
            type="text"
            placeholder="Año Nuevo, Día de la Madre…"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="description">Qué muestra el video (opcional)</label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="video">Link del video (opcional)</label>
          <input
            id="video"
            type="url"
            placeholder="https://"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <div className="sheet-actions">
          {!isNew && (
            <button
              type="button"
              className="btn danger"
              onClick={handleDelete}
              disabled={saving}
            >
              Borrar
            </button>
          )}
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}
