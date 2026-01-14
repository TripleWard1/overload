// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * StackBlitz às vezes não injeta process.env como num PC normal.
 * Então: 1) tenta process.env
 *        2) tenta globalThis.__ENV (vamos criar já a seguir)
 */
const env = (key: string) =>
  (process.env[key] as string | undefined) ??
  ((globalThis as any).__ENV?.[key] as string | undefined);

const firebaseConfig = {
  apiKey: env("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: env("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: env("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: env("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: env("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: env("NEXT_PUBLIC_FIREBASE_APP_ID"),
};

// ✅ Se faltar alguma key, não crasha o site todo.
// Só avisa na consola e deixa a app renderizar (tu podes mostrar UI de erro depois).
const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length) {
  console.warn(
    "[firebase] Missing env vars:",
    missing.join(", "),
    " — define no StackBlitz Environment Variables ou no .env"
  );
}

// Se estiver incompleto, inicializa com dummy seguro (para não rebentar no import)
const safeConfig =
  missing.length === 0
    ? (firebaseConfig as Required<typeof firebaseConfig>)
    : ({
        apiKey: "DUMMY",
        authDomain: "DUMMY",
        projectId: "DUMMY",
        storageBucket: "DUMMY",
        messagingSenderId: "DUMMY",
        appId: "DUMMY",
      } as any);

const app = getApps().length ? getApp() : initializeApp(safeConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
