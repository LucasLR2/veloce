"use client";

import { useState } from "react";
import { CloseIcon, CopyIcon } from "@/components/Icons";

// Panel lateral para editar un proyecto (reemplaza a ProjectForm)
export default function ProjectDrawer({ project, onSave, onDelete, onClose, onNotify }) {
  const [phrase, setPhrase] = useState(project.phrase || "");
  const [date, setDate] = useState(project.publish_date || "");
  const [status, setStatus] = useState(project.status === "pendiente" ? "pendiente" : "subido");
  const [url, setUrl] = useState(project.youtube_url || "");
  const [notes, setNotes] = useState(project.notes || "");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const link = url.trim();
    const found = {};
    if (!phrase.trim()) found.phrase = "Escribí la frase.";
    if (!date) found.date = "Elegí una fecha.";
    if (link && !/^https?:\/\/\S+\.\S+/.test(link)) found.url = "Tiene que empezar con http:// o https://";
    else if (!link && status === "subido") found.url = "Para marcarlo como Subido necesitás el link de YouTube.";
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    const msg = await onSave({ phrase: phrase.trim(), publish_date: date, status, youtube_url: link || null, notes: notes.trim() || null });
    if (msg) { setError(msg); setSaving(false); }
  }

  async function remove() {
    if (!window.confirm("¿Borrar este proyecto? No se puede deshacer.")) return;
    const msg = await onDelete();
    if (msg) setError(msg);
  }

  async function copy() {
    try { await navigator.clipboard.writeText(phrase); onNotify("Frase copiada"); }
    catch { onNotify("No se pudo copiar"); }
  }

  return (
    <div className="scrim" onClick={onClose}>
      <form className="drawer" onClick={(e) => e.stopPropagation()} onSubmit={submit} noValidate>
        <div className="row">
          <h2>{project.id ? "Proyecto" : "Nuevo proyecto"}</h2>
          <button type="button" className="btn small" onClick={onClose} aria-label="Cerrar"><CloseIcon width={16} height={16} /></button>
        </div>

        <div className="field">
          <label htmlFor="phrase">Frase del día</label>
          <textarea id="phrase" rows={3} className={errors.phrase ? "invalid" : ""} value={phrase} onChange={(e) => setPhrase(e.target.value)} />
          {errors.phrase && <p className="field-error">{errors.phrase}</p>}
          <button type="button" className="btn small" style={{ alignSelf: "flex-start" }} onClick={copy} disabled={!phrase}>
            <CopyIcon width={15} height={15} /> Copiar
          </button>
        </div>

        <div className="field">
          <label htmlFor="date">Fecha de publicación</label>
          <input id="date" type="date" className={errors.date ? "invalid" : ""} value={date} onChange={(e) => setDate(e.target.value)} />
          {errors.date && <p className="field-error">{errors.date}</p>}
        </div>

        <div className="field">
          <label>Estado</label>
          <div className="seg">
            {["pendiente", "subido"].map((s) => (
              <button key={s} type="button" className={status === s ? "on" : ""} onClick={() => setStatus(s)}>
                {s === "pendiente" ? "Pendiente" : "Subido"}
              </button>
            ))}
          </div>
          <span className="muted" style={{ fontSize: ".8rem" }}>Pasa a Publicado solo cuando llega la fecha.</span>
        </div>

        <div className="field">
          <label htmlFor="yt">Link de YouTube</label>
          <div className="row">
            <input id="yt" type="url" placeholder="https://" className={errors.url ? "invalid" : ""} value={url} onChange={(e) => setUrl(e.target.value)} />
            {/^https?:\/\//.test(url.trim()) && (
              <a className="btn" href={url.trim()} target="_blank" rel="noopener noreferrer">Abrir</a>
            )}
          </div>
          {errors.url && <p className="field-error">{errors.url}</p>}
        </div>

        <div className="field">
          <label htmlFor="notes">Notas</label>
          <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="error">{error}</p>}

        <div className="row" style={{ marginTop: "auto" }}>
          {project.id ? <button type="button" className="btn danger" onClick={remove}>Borrar</button> : <span />}
          <button className="btn primary" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
        </div>
      </form>
    </div>
  );
}