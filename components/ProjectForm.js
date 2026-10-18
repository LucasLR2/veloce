"use client";

import { useState } from "react";
import { STATUSES } from "@/lib/helpers";
import { CloseIcon, CopyIcon, PlayIcon } from "@/components/Icons";

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
  const [errors, setErrors] = useState({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validación propia (sin los globos del navegador)
    const found = {};
    if (!phrase.trim()) found.phrase = "Escribí la frase del día.";
    if (!publishDate) found.publishDate = "Elegí una fecha de publicación.";
    if (videoUrl.trim() && !/^https?:\/\/\S+\.\S+/.test(videoUrl.trim())) {
      found.videoUrl = "El link tiene que empezar con http:// o https://";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);

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
    setSaving(true);
    const message = await onDelete();
    if (message) {
      setConfirmingDelete(false);
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
        noValidate
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
            placeholder="Escribí la frase del día…"
            autoFocus={isNew}
            className={errors.phrase ? "invalid" : ""}
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
          />
          {errors.phrase && <p className="field-error">{errors.phrase}</p>}
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
              className={errors.publishDate ? "invalid" : ""}
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
            />
            {errors.publishDate && (
              <p className="field-error">{errors.publishDate}</p>
            )}
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
          <div className="input-row">
            <input
              id="video"
              type="url"
              placeholder="https://"
              className={errors.videoUrl ? "invalid" : ""}
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            {/^https?:\/\//.test(videoUrl.trim()) && (
              <a
                className="btn outline"
                href={videoUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PlayIcon width={18} height={18} />
                Abrir
              </a>
            )}
          </div>
          {errors.videoUrl && <p className="field-error">{errors.videoUrl}</p>}
        </div>

        {error && <p className="error">{error}</p>}

        <div className="sheet-actions">
          {!isNew && (
            <button
              type="button"
              className="btn danger"
              onClick={() => setConfirmingDelete(true)}
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

      {confirmingDelete && (
        <div
          className="confirm-overlay"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmingDelete(false);
          }}
        >
          <div
            className="confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="confirm-title">¿Borrar este proyecto?</h3>
            <p className="muted">
              Se elimina la frase con todos sus datos. No se puede deshacer.
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn danger-solid"
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? "Borrando…" : "Borrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
