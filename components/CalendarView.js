"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProjectDrawer from "@/components/ProjectDrawer";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/Icons";
import { effectiveStatus, alertLevel, toStr, todayStr } from "@/lib/helpers";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function CalendarView() {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [projects, setProjects] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState("");

  async function load() {
    const { data, error } = await supabase.from("projects").select("*");
    if (error) setLoadError("No se pudieron cargar los proyectos.");
    else { setProjects(data); setLoadError(""); }
  }
  useEffect(() => { load(); }, []);

  function showToast(text) {
    setToast(text);
    setTimeout(() => setToast(""), 2500);
  }

  const byDate = useMemo(() => Object.fromEntries(projects.map((p) => [p.publish_date, p])), [projects]);

  // Cuadrícula de semanas completas (lunes a domingo)
  const cells = useMemo(() => {
    const offset = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7;
    const days = new Date(ym.y, ym.m + 1, 0).getDate();
    const total = Math.ceil((offset + days) / 7) * 7;
    return Array.from({ length: total }, (_, i) => new Date(ym.y, ym.m, 1 - offset + i));
  }, [ym]);

  const stats = useMemo(() => {
    const today = todayStr();
    const s = { listos: 0, pendientes: 0, vacios: 0 };
    cells.filter((d) => d.getMonth() === ym.m).forEach((d) => {
      const p = byDate[toStr(d)];
      if (!p) { if (toStr(d) >= today) s.vacios += 1; }
      else if (effectiveStatus(p) === "pendiente") s.pendientes += 1;
      else s.listos += 1;
    });
    return s;
  }, [cells, byDate, ym]);

  function go(delta) {
    const d = new Date(ym.y, ym.m + delta, 1);
    setYm({ y: d.getFullYear(), m: d.getMonth() });
  }

  const friendly = (e) => (e.code === "23505" ? "Ya hay un proyecto en esa fecha." : "No se pudo guardar. Probá de nuevo.");

  async function handleSave(values) {
    const isNew = !editing.id;
    const { error } = isNew
      ? await supabase.from("projects").insert(values)
      : await supabase.from("projects").update(values).eq("id", editing.id);
    if (error) return friendly(error);
    setEditing(null);
    await load();
    showToast(isNew ? "Proyecto creado" : "Cambios guardados");
  }

  async function handleDelete() {
    const { error } = await supabase.from("projects").delete().eq("id", editing.id);
    if (error) return "No se pudo borrar.";
    setEditing(null);
    await load();
    showToast("Proyecto borrado");
  }

  const title = new Date(ym.y, ym.m, 1).toLocaleDateString("es-UY", { month: "long", year: "numeric" });
  const today = todayStr();

  return (
    <main className="main">
      <header className="head">
        <h1>Calendario</h1>
        <div className="cal-nav">
          <button className="btn" onClick={() => go(-1)} aria-label="Mes anterior"><ChevronLeftIcon width={18} height={18} /></button>
          <span className="cal-title">{title}</span>
          <button className="btn" onClick={() => go(1)} aria-label="Mes siguiente"><ChevronRightIcon width={18} height={18} /></button>
          <button className="btn" onClick={() => setYm({ y: now.getFullYear(), m: now.getMonth() })}>Hoy</button>
        </div>
      </header>

      <div className="cal-stats">
        <span><b>{stats.listos}</b> con video</span>
        <span><b>{stats.pendientes}</b> pendientes</span>
        <span><b>{stats.vacios}</b> días libres</span>
      </div>

      {loadError && <p className="error">{loadError}</p>}

      <div className="cal">
        <div className="cal-week">{DAYS.map((d) => <span key={d}>{d}</span>)}</div>
        <div className="cal-grid" style={{ gridTemplateRows: `repeat(${cells.length / 7}, 1fr)` }}>
          {cells.map((d) => {
            const str = toStr(d);
            const p = byDate[str];
            const inMonth = d.getMonth() === ym.m;
            const free = !p && inMonth && str >= today;
            const level = p ? alertLevel(p) : null;
            const cls = [
              "cal-day",
              !inMonth && "out",
              str === today && "today",
              free && "free",
              level === "rojo" && "a-bad",
              level && level !== "rojo" && "a-warn",
            ].filter(Boolean).join(" ");
            return (
              <button
                key={str}
                className={cls}
                disabled={!p && !free}
                onClick={() => setEditing(p || { publish_date: str, status: "pendiente" })}
                aria-label={p ? `${str}: ${p.phrase}` : `Agregar proyecto el ${str}`}
              >
                <span className="cal-num">{d.getDate()}</span>
                {p && (
                  <>
                    <span className="cal-phrase">{p.phrase}</span>
                    <span className={`cal-dot ${effectiveStatus(p)}`} />
                  </>
                )}
                {free && <span className="cal-plus">+</span>}
              </button>
            );
          })}
        </div>
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}
      {editing && (
        <ProjectDrawer
          key={editing.id || editing.publish_date}
          project={editing}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditing(null)}
          onNotify={showToast}
        />
      )}
    </main>
  );
}