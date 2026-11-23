// Logo de Veloce: sol sobre el horizonte con su reflejo. Hereda el color del texto.
export function LogoMark({ size = 40, ...props }) {
  return (
    <svg
      viewBox="0 12 64 46"
      width={size}
      height={(size * 46) / 64}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M10 38A22 22 0 0 1 54 38" strokeWidth="3" />
      <path d="M2 38H62" strokeWidth="3" />
      <path d="M14 47H50" strokeWidth="2.2" strokeOpacity=".65" />
      <path d="M22 55H42" strokeWidth="2.2" strokeOpacity=".35" />
    </svg>
  );
}

// Versión completa: marca + nombre + lema (para la barra lateral y el login)
export default function Logo({ size = 48, tagline = false }) {
  return (
    <div className="logo-lockup">
      <LogoMark size={size} />
      <span className="logo-word">VELOCE</span>
      {tagline && <span className="logo-tag">CONTENIDO · EN ORDEN</span>}
    </div>
  );
}
