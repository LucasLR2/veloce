"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProjectForm from "@/components/ProjectForm";
import LinkPrompt from "@/components/LinkPrompt";
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
  PlayIcon,
  FolderIcon,
} from "@/components/Icons";
import {
  statusLabel,
  nextStatus,
  alertLevel,
  alertText,
  formatDate,
  nextDateAfterLast,
  addDays,
  todayStr,
} from "@/lib/helpers";

// Dirección de tu carpeta de OneDrive (se configura en .env.local y en Vercel)
const FOLDER_URL = process.env.NEXT_PUBLIC_ONEDRIVE_FOLDER_URL;

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
  // null = cerrado, { project, next } = pidiendo el link del video
  const [linkPrompt, setLinkPrompt] = useState(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);

  function showToast(text) {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2500);
  }

  async function loadProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("publish_date", { ascending: true });

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
      showToast("Frase copiada");
    } catch {
      showToast("No se pudo copiar la frase");
    }
  }

  // Cambia el estado (y, si hace falta, el link). Devuelve un texto de error si falla.
  async function applyStatus(project, next, extra = {}) {
    const changes = { status: next, ...extra };

    // Se actualiza en pantalla al instante y después se guarda
    setProjects((list) =>
      list.map((p) => (p.id === project.id ? { ...p, ...changes } : p))
    );

    const { error } = await supabase
      .from("projects")
      .update(changes)
      .eq("id", project.id);

    if (error) {
      setProjects((list) =>
        list.map((p) => (p.id === project.id ? project : p))
      );
      return "No se pudo cambiar el estado. Probá de nuevo.";
    }
    showToast(`Estado: ${statusLabel(next)}`);
  }

  // Pasa el proyecto al estado siguiente. Para Editado o Publicado hace falta el link.
  async function cycleStatus(project) {
    const next = nextStatus(project.status);

    if (next !== "pendiente" && !project.video_url) {
      setLinkPrompt({ project, next });
      return;
    }

    const message = await applyStatus(project, next);
    if (message) showToast(message);
  }

  async function confirmLink(link) {
    const { project, next } = linkPrompt;
    const message = await applyStatus(project, next, { video_url: link });
    if (message) return message;
    setLinkPrompt(null);
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

  const isToday = dateFilter === todayStr();
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
        <div className="top-actions">
          {FOLDER_URL && (
            <a
              className="btn outline"
              href={FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FolderIcon width={18} height={18} />
              Carpeta
            </a>
          )}
          <button
            className="btn outline"
            onClick={() => supabase.auth.signOut()}
          >
            Salir
          </button>
        </div>
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
          <button
            className={`icon-btn today ${isToday ? "on" : ""}`}
            onClick={() => setDateFilter(isToday ? "" : todayStr())}
            aria-pressed={isToday}
            aria-label="Filtrar por hoy"
          >
            Hoy
          </button>
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
        <button className="btn primary add" onClick={openNew}>
          <PlusIcon width={18} height={18} />
          Agregar
        </button>
      </div>

      <section className="stats" aria-label="Filtrar por estado">
        {stats.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`stat ${statusFilter === key ? "on" : ""}`}
            aria-pressed={statusFilter === key}
            onClick={() => setStatusFilter(statusFilter === key ? "todos" : key)}
          >
            <span className={`stat-icon status-${key}`}>
              <Icon width={22} height={22} />
            </span>
            <span className="stat-text">
              <span className="stat-label">{label}</span>
              <span className="stat-number">{two(counts[key])}</span>
            </span>
          </button>
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
            <li
              key={p.id}
              className={`item item-${p.status} ${level ? `alert-${level}` : ""}`}
            >
              <button className="item-main" onClick={() => setEditing(p)}>
                <span className="phrase">{p.phrase}</span>
                <span className="meta">
                  <span className="date">
                    <CalendarIcon width={18} height={18} />
                    {formatDate(p.publish_date)}
                  </span>
                  {level && (
                    <span className={`alert-text text-${level}`}>
                      {alertText(p)}
                    </span>
                  )}
                </span>
              </button>

              <div className="item-actions">
                <div className="item-actions-row">
                  {p.video_url && (
                    <a
                      className="btn outline small play"
                      href={p.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Ver video"
                      title="Ver video"
                    >
                      <PlayIcon width={18} height={18} />
                    </a>
                  )}
                  <button
                    className="btn outline small"
                    onClick={() => copyPhrase(p)}
                    aria-label="Copiar frase"
                  >
                    <CopyIcon width={15} height={15} />
                    Copiar
                  </button>
                </div>
                <button
                  className={`btn small status-btn status-${p.status}`}
                  onClick={() => cycleStatus(p)}
                  aria-label={`Estado: ${statusLabel(p.status)}. Tocar para cambiar`}
                >
                  {statusLabel(p.status)}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      {linkPrompt && (
        <LinkPrompt
          nextLabel={statusLabel(linkPrompt.next)}
          onConfirm={confirmLink}
          onCancel={() => setLinkPrompt(null)}
        />
      )}

      {editing && (
        <ProjectForm
          initial={editing}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setEditing(null)}
          onNotify={showToast}
        />
      )}
    </main>
  );
}
