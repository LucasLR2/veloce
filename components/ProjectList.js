"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProjectDrawer from "@/components/ProjectDrawer";
import BatchForm from "@/components/BatchForm";
import { SearchIcon, ClockIcon, UploadIcon, CheckCircleIcon, PlusIcon, CopyIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/Icons";
import { effectiveStatus, statusLabel, alertLevel, alertText, formatDate, nextDateAfterLast, coverage, missingDays } from "@/lib/helpers";

const PAGE_SIZE = 8;
const two = (n) => String(n).padStart(2, "0");

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [editing, setEditing] = useState(null); // proyecto abierto en el panel
  const [batchOpen, setBatchOpen] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const searchRef = useRef(null);

  function showToast(text) {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2500);
  }

  async function load() {
    const { data, error } = await supabase.from("projects").select("*").order("publish_date", { ascending: true });
    if (error) setLoadError("No se pudieron cargar los proyectos.");
    else { setProjects(data); setLoadError(""); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  // Atajos: N agrega frases, / busca, Esc cierra
  useEffect(() => {
    function onKey(e) {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName);
      if (e.key === "Escape") { setEditing(null); setBatchOpen(false); }
      if (typing || e.metaKey || e.ctrlKey) return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setBatchOpen(true); }
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = useMemo(() => {
    const c = { pendiente: 0, subido: 0, publicado: 0 };
    projects.forEach((p) => { c[effectiveStatus(p)] += 1; });
    return c;
  }, [projects]);

  const cover = useMemo(() => coverage(projects), [projects]);
  const gaps = useMemo(() => missingDays(projects), [projects]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) =>
      (!q || p.phrase.toLowerCase().includes(q)) &&
      (statusFilter === "todos" || effectiveStatus(p) === statusFilter));
  }, [projects, search, statusFilter]);

  // Paginado
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageItems = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const firstPage = Math.max(1, Math.min(current - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => firstPage + i);

  const friendly = (e) => (e.code === "23505" ? "Ya hay un proyecto en una de esas fechas." : "No se pudo guardar. Probá de nuevo.");

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

  async function handleBatch(rows) {
    const { error } = await supabase.from("projects").insert(rows);
    if (error) return friendly(error);
    setBatchOpen(false);
    await load();
    showToast(`${rows.length} frases agregadas`);
  }

  async function copy(e, p) {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(p.phrase); showToast("Frase copiada"); }
    catch { showToast("No se pudo copiar"); }
  }

  const kpis = [
    { key: "pendiente", label: "Pendientes", Icon: ClockIcon },
    { key: "subido", label: "Subidos", Icon: UploadIcon },
    { key: "publicado", label: "Publicados", Icon: CheckCircleIcon },
  ];

  return (
    <main className="main">
      <header className="head">
        <h1>Proyectos</h1>
        <div className="head-actions">
          <label className="search-wrap">
            <SearchIcon width={18} height={18} />
            <input
              ref={searchRef}
              placeholder="Buscar frases…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <kbd>/</kbd>
          </label>
          <button className="btn primary" onClick={() => setBatchOpen(true)}>
            <PlusIcon width={18} height={18} /> Agregar frases <kbd>N</kbd>
          </button>
        </div>
      </header>

      <section className="kpis">
        {kpis.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`kpi ${statusFilter === key ? "on" : ""}`}
            onClick={() => { setStatusFilter(statusFilter === key ? "todos" : key); setPage(1); }}
          >
            <span className="kpi-top"><Icon width={20} height={20} /> {label}</span>
            <span className="kpi-num">{two(counts[key])}</span>
          </button>
        ))}
        <div className="kpi">
          <span className="kpi-top">Colchón de contenido</span>
          <strong style={{ fontWeight: 500 }}>
            {cover.days > 0 ? `Cubierto hasta el ${formatDate(cover.until)} · ${cover.days} días` : "Sin videos subidos por delante"}
          </strong>
          <div className="bar"><i style={{ width: `${Math.min(cover.days / 30, 1) * 100}%` }} /></div>
        </div>
      </section>

      {gaps > 0 && <div className="notice">Hay {gaps} {gaps === 1 ? "día" : "días"} sin proyecto antes de tu último video programado.</div>}

      <div className="table-wrap">
        {loading && <p className="muted empty">Cargando…</p>}
        {loadError && <p className="error empty">{loadError}</p>}
        {!loading && !loadError && visible.length === 0 && (
          <p className="muted empty">{projects.length ? "Nada coincide con tu búsqueda." : "Todavía no hay frases. Tocá Agregar frases para empezar."}</p>
        )}

        {visible.length > 0 && (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 170 }}>Fecha</th>
                    <th>Frase</th>
                    <th style={{ width: 140 }}>Estado</th>
                    <th style={{ width: 190 }}>YouTube</th>
                    <th style={{ width: 60 }} />
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((p) => {
                    const st = effectiveStatus(p);
                    const level = alertLevel(p);
                    const cls = level === "rojo" ? "a-bad" : level ? "a-warn" : "";
                    return (
                      <tr key={p.id} className={`${cls} ${editing?.id === p.id ? "sel" : ""}`} onClick={() => setEditing(p)}>
                        <td className="fixed">{formatDate(p.publish_date)}</td>
                        <td>
                          {p.phrase}
                          {level && <span className={`alert-text ${level === "rojo" ? "bad" : "warn"}`}>{alertText(p)}</span>}
                        </td>
                        <td className="fixed"><span className={`pill ${st}`}>{statusLabel(st)}</span></td>
                        <td className="fixed">
                          {p.youtube_url
                            ? <a className="yt" href={p.youtube_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>Ver video</a>
                            : <span className="muted">—</span>}
                        </td>
                        <td className="fixed">
                          <button className="btn small" onClick={(e) => copy(e, p)} aria-label="Copiar frase">
                            <CopyIcon width={15} height={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pager">
              <span className="muted">
                {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, visible.length)} de {visible.length}
              </span>
              <div className="pager-btns">
                <button className="btn small" onClick={() => setPage(current - 1)} disabled={current === 1} aria-label="Página anterior">
                  <ChevronLeftIcon width={16} height={16} />
                </button>
                {pages.map((n) => (
                  <button key={n} className={`btn small ${n === current ? "primary" : ""}`} onClick={() => setPage(n)}>
                    {n}
                  </button>
                ))}
                <button className="btn small" onClick={() => setPage(current + 1)} disabled={current === totalPages} aria-label="Página siguiente">
                  <ChevronRightIcon width={16} height={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {toast && <div className="toast" role="status">{toast}</div>}
      {batchOpen && (
        <BatchForm
          startDate={nextDateAfterLast(projects.map((p) => p.publish_date))}
          takenDates={projects.map((p) => p.publish_date)}
          onSave={handleBatch}
          onClose={() => setBatchOpen(false)}
        />
      )}
      {editing && (
        <ProjectDrawer
          key={editing.id}
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