// Estados de un proyecto (el valor es lo que se guarda en Supabase)
export const STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "editado", label: "Editado" },
  { value: "publicado", label: "Publicado" },
];

export function statusLabel(value) {
  const found = STATUSES.find((s) => s.value === value);
  return found ? found.label : value;
}

// ---------- Fechas (siempre como texto "YYYY-MM-DD", en hora local) ----------

function pad(n) {
  return String(n).padStart(2, "0");
}

export function toStr(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseStr(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayStr() {
  return toStr(new Date());
}

export function addDays(str, n) {
  const d = parseStr(str);
  d.setDate(d.getDate() + n);
  return toStr(d);
}

// Días que faltan hasta la fecha (0 = hoy, negativo = ya pasó)
export function daysUntil(str) {
  const diff = parseStr(str) - parseStr(todayStr());
  return Math.round(diff / 86400000);
}

// Primera fecha desde hoy que todavía no tiene proyecto
export function nextFreeDate(takenDates) {
  let d = todayStr();
  while (takenDates.has(d)) d = addDays(d, 1);
  return d;
}

export function formatDate(str) {
  return parseStr(str).toLocaleDateString("es-UY", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------- Avisos ----------
// Solo avisan los proyectos en "pendiente":
// 7 días o menos = amarillo, 3 o menos = naranja, 1 o menos = rojo
export function alertLevel(project) {
  if (project.status !== "pendiente") return null;
  const n = daysUntil(project.publish_date);
  if (n <= 1) return "rojo";
  if (n <= 3) return "naranja";
  if (n <= 7) return "amarillo";
  return null;
}

export function alertText(project) {
  const n = daysUntil(project.publish_date);
  if (n < 0) return "Fecha vencida";
  if (n === 0) return "Se publica hoy";
  if (n === 1) return "Falta 1 día";
  return `Faltan ${n} días`;
}
