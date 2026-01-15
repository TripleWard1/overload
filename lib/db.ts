// lib/db.ts
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc as fsDeleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

function sanitizeForFirestore<T>(value: T): T {
  // Firestore NÃO aceita undefined (em lado nenhum)
  if (value === undefined) return undefined as any;

  if (Array.isArray(value)) {
    // remove undefined de arrays e sanitiza recursivamente
    return value
      .map((v) => sanitizeForFirestore(v))
      .filter((v) => v !== undefined) as any;
  }

  if (value && typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value as any)) {
      const sv = sanitizeForFirestore(v);
      if (sv !== undefined) out[k] = sv; // remove chaves undefined
    }
    return out;
  }

  return value;
}


/**
 * Estrutura:
 * users/{uid}/{collectionName}/{docId}
 */

export async function loadUserCollection<T>(
  uid: string,
  collectionName: string
): Promise<T[]> {
  const colRef = collection(db, "users", uid, collectionName);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as T[];
}

export async function upsertUserDoc(
  uid: string,
  collectionName: string,
  data: { id: string } & Record<string, any>
): Promise<void> {
  if (!data?.id) throw new Error("upsertUserDoc: data.id é obrigatório");
  const ref = doc(db, "users", uid, collectionName, data.id);
  await setDoc(ref, sanitizeForFirestore(data), { merge: true });

}

export async function deleteUserDoc(
  uid: string,
  collectionName: string,
  id: string
): Promise<void> {
  const ref = doc(db, "users", uid, collectionName, id);
  await fsDeleteDoc(ref);
}
