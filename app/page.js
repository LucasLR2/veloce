"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Login from "@/components/Login";
import Sidebar from "@/components/Sidebar";
import ProjectList from "@/components/ProjectList";

export default function Home() {
  // undefined = comprobando, null = sin sesión
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <main className="center"><p className="muted">Cargando…</p></main>;
  }
  if (!session) return <Login />;

  return (
    <div className="shell">
      <Sidebar email={session.user.email} onSignOut={() => supabase.auth.signOut()} />
      <ProjectList />
    </div>
  );
}