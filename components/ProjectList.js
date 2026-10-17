"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProjectForm from "@/components/ProjectForm";
import {
  SearchIcon,
  CalendarIcon,
  ClockIcon,
  PencilIcon,
  CheckCircleIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  CloseIcon,
} from "@/components/Icons";
import {
  STATUSES,
  statusLabel,
  alertLevel,
  alertText,
  formatDate,
  nextDateAfterLast,
  addDays,
  todayStr,
} from "@/lib/helpers";

function two(n) {
  return String(n).padStart(2, "0");
}

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  // null = cerrado, objeto = proyecto abierto (nuevo si no tiene id)
  const [editing, setEditing] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [toast, setToast] = useState("");

  function showToast(text) {
    setToast(text);
    setTimeout(() => setToast(""), 2500);
  }

  async function loadProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("publish_date", { ascending: false });

    if (error) {
      setLoadError("No se pudieron cargar los proyectos.");
    } else {
      setProjects(data);
      setLoadError("");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const counts = useMemo(() => {
    const c = { pendiente: 0, editado: 0, publicado: 0 };
    projects.forEach((p) => {
      if (c[p.status] !== undefined) c[p.status] += 1;
    });
    return c;
  }, [projects]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (q && !p.phrase.toLowerCase().includes(q)) return false;
      if (dateFilter && p.publish_date !== dateFilter) return false;
      if (statusFilter !== "todos" && p.status !== statusFilter) return false;
      return true;
    });
  }, [projects, search, dateFilter, statusFilter]);

  function friendlyError(error) {
    if (error.code === "23505") return "Ya hay un proyecto para esa fecha.";
    return "No se pudo guardar. Probá de nuevo.";
  }

  // Devuelve un texto de error, o nada si salió bien
  async function handleSave(values) {
    const query = editing.id
      ? supabase.from("projects").update(values).eq("id", editing.id)
      : supabase.from("projects").insert(values);

    const wasNew = !editing.id;
    const { error } = await query;
    if (error) return friendlyError(error);

    setEditing(null);
    await loadProjects();
    showToast(wasNew ? "Proyecto creado" : "Cambios guardados");
  }

  async function handleDelete() {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", editing.id);
    if (error) return "No se pudo borrar. Probá de nuevo.";

    setEditing(null);
    await loadProjects();
    showToast("Proyecto borrado");
  }

  async function copyPhrase(project) {
    try {
      await navigator.clipboard.writeText(project.phrase);
      setCopiedId(project.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // si el navegador bloquea el portapapeles, no pasa nada
    }
  }

  function openNew() {
    setEditing({
      publish_date: nextDateAfterLast(projects.map((p) => p.publish_date)),
      status: "pendiente",
    });
  }

  // Mueve el filtro de fecha un día; si no hay fecha elegida, parte desde hoy
  function shiftDate(days) {
    setDateFilter(addDays(dateFilter || todayStr(), days));
  }

  const hasFilters = search || dateFilter || statusFilter !== "todos";

  const stats = [
    { key: "pendiente", label: "Pendientes", Icon: ClockIcon },
    { key: "editado", label: "Editados", Icon: PencilIcon },
    { key: "publicado", label: "Publicados", Icon: CheckCircleIcon },
  ];

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <h1 className="logo">Veloce</h1>
          <span className="divider" />
          <span className="tagline">Tu contenido, organizado</span>
        </div>
        <button className="btn outline" onClick={() => supabase.auth.signOut()}>
          Salir
        </button>
      </header>

      <div className="toolbar">
        <div className="search-wrap">
          <SearchIcon />
          <input
            className="search"
            type="search"
            placeholder="Buscar una frase…"
            aria-label="Buscar por frase"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="date-nav">
          <input
            className="datefilter"
            type="date"
            aria-label="Filtrar por fecha"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <button
            className="icon-btn"
            onClick={() => shiftDate(-1)}
            aria-label="Día anterior"
          >
            <ChevronLeftIcon />
          </button>
          {dateFilter && dateFilter !== todayStr() ? (
            <button
              className="icon-btn"
              onClick={() => setDateFilter("")}
              aria-label="Quitar filtro de fecha"
            >
              <CloseIcon />
            </button>
          ) : (
            <button
              className={`icon-btn today ${dateFilter ? "on" : ""}`}
              onClick={() => setDateFilter(dateFilter ? "" : todayStr())}
              aria-label="Filtrar por hoy"
            >
              Hoy
            </button>
          )}
          <button
            className="icon-btn"
            onClick={() => shiftDate(1)}
            aria-label="Día siguiente"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className="actions">
        <div className="chips" role="group" aria-label="Filtrar por estado">
          {[{ value: "todos", label: "Todos" }, ...STATUSES].map((s) => (
            <button
              key={s.value}
              className={`chip ${statusFilter === s.value ? "on" : ""}`}
              onClick={() => setStatusFilter(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button className="btn primary add" onClick={openNew}>
          <PlusIcon width={18} height={18} />
          Agregar
        </button>
      </div>

      <section className="stats" aria-label="Resumen por estado">
        {stats.map(({ key, label, Icon }) => (
          <div key={key} className="stat">
            <span className={`stat-icon status-${key}`}>
              <Icon width={22} height={22} />
            </span>
            <div>
              <div className="stat-label">{label}</div>
              <div className="stat-number">{two(counts[key])}</div>
            </div>
          </div>
        ))}
      </section>

      {loading && <p className="muted pad">Cargando proyectos…</p>}
      {loadError && <p className="error pad">{loadError}</p>}

      {!loading && !loadError && visible.length === 0 && (
        <p className="muted pad">
          {hasFilters
            ? "Ningún proyecto coincide con tu búsqueda."
            : "Todavía no hay proyectos. Tocá Agregar para crear el primero."}
        </p>
      )}

      <ul className="list">
        {visible.map((p) => {
          const level = alertLevel(p);
          return (
            <li key={p.id} className={`item ${level ? `alert-${level}` : ""}`}>
              <button className="item-main" onClick={() => setEditing(p)}>
                <span className="phrase">{p.phrase}</span>
                <span className="meta">
                  <span className="date">
                    <CalendarIcon width={18} height={18} />
                    {formatDate(p.publish_date)}
                  </span>
                  <span className={`tag status-${p.status}`}>
                    {statusLabel(p.status)}
                  </span>
                  {p.occasion && <span className="tag occasion">{p.occasion}</span>}
                  {level && (
                    <span className={`alert-text text-${level}`}>
                      {alertText(p)}
                    </span>
                  )}
                </span>
              </button>
              <button
                className="btn outline small copy"
                onClick={() => copyPhrase(p)}
                aria-label="Copiar frase"
              >
                <CopyIcon width={15} height={15} />
                {copiedId === p.id ? "Copiada" : "Copiar"}
              </button>
            </li>
          );
        })}
      </ul>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      {editing && (
        <ProjectForm
          initial={editing}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}
