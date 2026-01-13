"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

export default function LandingPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const loginWithGoogle = async () => {
    setErr(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
      // não faz router.replace aqui — o redirect sai da página
    } catch (e: any) {
      setErr(e?.message ?? "Erro no login com Google");
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Apanha o resultado do login via redirect (quando volta do Google)
    getRedirectResult(auth).catch(() => {});
  }, []);
  

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserEmail(u?.email ?? null);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      const e = email.trim();
      if (!e || !password) return;

      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, e, password);
      } else {
        await signInWithEmailAndPassword(auth, e, password);
      }

      router.replace("/"); // 👉 vai para a tua app (app/page.tsx)
    } catch (e: any) {
      setErr(e?.message ?? "Erro no login");
    } finally {
      setLoading(false);
    }
  };

  if (checking) return null;

  return (
    <main className="min-h-screen bg-[#070B14] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_24px_90px_rgba(0,0,0,0.55)] overflow-hidden">
        {/* HERO */}
        <div className="relative p-8">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(900px_600px_at_20%_10%,rgba(34,197,94,0.25),transparent_60%),radial-gradient(900px_620px_at_80%_20%,rgba(99,102,241,0.22),transparent_60%)]" />
          <div className="relative">
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-300">
              Overload
            </div>
            <h1 className="mt-2 text-3xl font-black italic uppercase tracking-tight">
              Treina. Regista. Evolui.
            </h1>
            <p className="mt-2 text-slate-300 text-xs leading-relaxed">
              Entra com Email/Password ou Google para acederes ao teu painel.
            </p>

            {userEmail && (
              <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Sessão ativa
                </div>
                <div className="mt-2 font-black text-white text-sm">{userEmail}</div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.replace("/")}
                    className="rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-[linear-gradient(135deg,#22c55e,#a3e635)] text-[#071018] active:scale-95"
                  >
                    Ir para a app
                  </button>
                  <button
                    onClick={async () => {
                      await signOut(auth);
                      setUserEmail(null);
                    }}
                    className="rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white active:scale-95"
                  >
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FORM */}
        {!userEmail && (
          <div className="p-8 pt-0">
            <div className="rounded-[2rem] bg-[#070B14]/55 border border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
                  {mode === "login" ? "Login" : "Criar conta"}
                </div>
                <button
                  onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
                  className="text-[10px] font-black uppercase tracking-widest text-emerald-300 hover:text-emerald-200"
                >
                  {mode === "login" ? "Criar conta" : "Já tenho conta"}
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {/* ✅ PONTO 3: BOTÃO GOOGLE (fica aqui, antes do email/pass) */}
                <button
                  onClick={loginWithGoogle}
                  disabled={loading}
                  className="w-full rounded-2xl px-4 py-4 text-[10px] font-black uppercase tracking-widest 
                             bg-white text-black flex items-center justify-center gap-3 active:scale-95 disabled:opacity-60"
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path
                      fill="#FFC107"
                      d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10 0 19-8 19-20 0-1.3-.1-2.7-.4-3.5z"
                    />
                    <path
                      fill="#FF3D00"
                      d="M6.3 14.7l6.6 4.8C14.7 16.2 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.4 4.3-17.7 10.7z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2c-2 1.5-4.5 2.4-7.3 2.4-5.2 0-9.6-3.5-11.1-8.3l-6.5 5C9.7 39.7 16.4 44 24 44z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.6 20.5H42V20H24v8h11.3c-1 2.7-3 5-5.7 6.6l6.3 5.2C39.6 36.2 43 30.7 43 24c0-1.3-.1-2.7-.4-3.5z"
                    />
                  </svg>
                  Continuar com Google
                </button>

                {/* Separador OU */}
                <div className="flex items-center gap-3 py-2">
                  <div className="h-px flex-1 bg-white/10" />
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                    ou
                  </div>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 ring-emerald-300/20 text-white placeholder:text-slate-500"
                />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  type="password"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 ring-emerald-300/20 text-white placeholder:text-slate-500"
                />

                {err && (
                  <div className="rounded-2xl bg-rose-500/10 border border-rose-400/20 px-4 py-3 text-xs font-bold text-rose-200">
                    {err}
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={loading || !email.trim() || !password}
                  className="w-full rounded-2xl px-4 py-4 text-[10px] font-black uppercase tracking-widest bg-[linear-gradient(135deg,#22c55e,#a3e635)] text-[#071018] disabled:opacity-60 active:scale-95"
                >
                  {loading ? "A processar..." : mode === "login" ? "Entrar" : "Registar"}
                </button>

                <button
                  onClick={() => router.replace("/")}
                  className="w-full rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white active:scale-95"
                >
                  Continuar sem login
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
