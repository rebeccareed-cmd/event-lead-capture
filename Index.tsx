import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import LoginScreen from "@/components/LoginScreen";
import LeadApp from "@/components/LeadApp";

export type Role = "admin" | "scanner";

const Index = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (!sess?.user) {
        setRole(null);
        setName("");
      } else {
        // defer DB calls
        setTimeout(() => loadRole(sess.user.id), 0);
      }
    });
    // Then existing session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) loadRole(sess.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadRole = async (uid: string) => {
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid),
      supabase.from("profiles").select("name, email").eq("user_id", uid).maybeSingle(),
    ]);
    const r = roles?.find((x) => x.role === "admin") ? "admin" : roles?.[0]?.role ?? "scanner";
    setRole(r as Role);
    setName(profile?.name || profile?.email?.split("@")[0] || "");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "hsl(var(--brand))" }}>
        <div className="spin spin-brand" />
      </div>
    );
  }

  if (!session || !user) return <LoginScreen />;

  return <LeadApp user={user} role={role ?? "scanner"} name={name} />;
};

export default Index;
