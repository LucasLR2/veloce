"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Login from "@/components/Login";
import ProjectList from "@/components/ProjectList";

export default function Home() {
  // undefined = todavía comprobando, null = sin sesión
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <main className="center">
        <p className="muted">Cargando…</p>
      </main>
    );
  }

  if (!session) return <Login />;

  return <ProjectList />;
}
