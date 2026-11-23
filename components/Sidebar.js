"use client";

import Logo from "@/components/Logo";
import { FolderIcon, CalendarIcon, LogOutIcon } from "@/components/Icons";

export default function Sidebar({ email, onSignOut }) {
  return (
    <aside className="sidebar">
      <Logo size={44} />
      <nav className="nav">
        <button className="on"><FolderIcon width={18} height={18} /> Proyectos</button>
        <button disabled title="Próximamente"><CalendarIcon width={18} height={18} /> Calendario</button>
      </nav>
      <div className="side-foot">
        <span className="muted" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{email}</span>
        <button onClick={onSignOut}><LogOutIcon width={18} height={18} /> Cerrar sesión</button>
      </div>
    </aside>
  );
}
