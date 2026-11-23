// Estados de un proyecto (el valor es lo que se guarda en Supabase)
export const STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "subido", label: "Subido" },
  { value: "publicado", label: "Publicado" },
];

export function statusLabel(value) {
  const found = STATUSES.find((s) => s.value === value);
  return found ? found.label : value;
}


// ---------- Fechas
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

export function effectiveStatus(p) {
  if (p.status === "pendiente") return "pendiente";
  if (p.status === "publicado" || p.publish_date <= todayStr()) return "publicado";
  return "subido";
}

// Días seguidos desde hoy con un video subido. Devuelve { days, until }
export function coverage(projects) {
  const ready = new Set(projects.filter((p) => p.status !== "pendiente" && p.youtube_url).map((p) => p.publish_date));
  let d = todayStr();
  let days = 0;
  while (ready.has(d)) { days += 1; d = addDays(d, 1); }
  return { days, until: addDays(d, -1) };
}

// Días libres entre hoy y el último proyecto
export function missingDays(projects) {
  if (!projects.length) return 0;
  const taken = new Set(projects.map((p) => p.publish_date));
  const last = projects.reduce((a, p) => (p.publish_date > a ? p.publish_date : a), todayStr());
  let d = todayStr();
  let n = 0;
  while (d < last) { if (!taken.has(d)) n += 1; d = addDays(d, 1); }
  return n;
}

// Fecha por defecto de un proyecto nuevo: el día siguiente al último registrado
// (nunca antes de hoy). Sin proyectos, arranca hoy.
export function nextDateAfterLast(dates) {
  const today = todayStr();
  if (dates.length === 0) return today;
  const last = dates.reduce((a, b) => (a > b ? a : b)); // "YYYY-MM-DD" ordena bien como texto
  const next = addDays(last, 1);
  return next > today ? next : today;
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
