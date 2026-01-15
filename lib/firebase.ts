"use client";

import "@/app/env.client"; // ✅ garante que globalThis.__ENV existe antes do initializeApp

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// lê env do browser (StackBlitz fallback) OU do process.env (Next)
// e remove aspas "..." ou '...' se existirem
function readEnv(key: string): string | undefined {
  const fromGlobal =
    typeof window !== "undefined"
      ? (globalThis as any).__ENV?.[key]
      : undefined;

  const fromProcess =
    typeof process !== "undefined" ? (process.env as any)?.[key] : undefined;

  const raw = fromGlobal ?? fromProcess;

  if (typeof raw !== "string") return raw;

  const v = raw.trim();
  // remove aspas se estiverem a envolver o valor
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1);
  }
  return v;
}

const firebaseConfig = {
  apiKey: readEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: readEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: readEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: readEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: readEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig as any);

export const auth = getAuth(app);
export const db = getFirestore(app);
