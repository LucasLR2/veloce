"use client";

import { useMemo, useState } from "react";
import { addDays, formatDate } from "@/lib/helpers";

// Reparte una frase por línea en días consecutivos, saltando los que ya tienen proyecto
export default function BatchForm({ startDate, takenDates, onSave, onClose }) {
  const [text, setText] = useState("");
  const [start, setStart] = useState(startDate);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => {
    const taken = new Set(takenDates);
    let d = start;
    return text.split("\n").map((l) => l.trim()).filter(Boolean).map((phrase) => {
      while (taken.has(d)) d = addDays(d, 1);
      const row = { phrase, publish_date: d };
      d = addDays(d, 1);
      return row;
    });
  }, [text, start, takenDates]);

  async function submit() {
    if (!rows.length) return setError("Pegá al menos una frase.");
    setSaving(true);
    const msg = await onSave(rows.map((r) => ({ ...r, status: "pendiente" })));
    if (msg) { setError(msg); setSaving(false); }
  }

  return (
    <div className="scrim center" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Agregar frases</h2>
        <div className="field">
          <label htmlFor="batch">Una frase por línea</label>
          <textarea id="batch" rows={8} autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={"La constancia vence al talento\nEmpezá hoy, perfecto no existe"} />
        </div>
        <div className="field">
          <label htmlFor="start">Empezar desde</label>
          <input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        {rows.length > 0 && (
          <div className="preview">
            {rows.map((r, i) => (
              <div key={i}><span>{formatDate(r.publish_date)}</span><span>{r.phrase}</span></div>
            ))}
          </div>
        )}
        {error && <p className="error">{error}</p>}
        <div className="row end">
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : `Guardar ${rows.length || ""} frases`}
          </button>
        </div>
      </div>
    </div>
  );
}