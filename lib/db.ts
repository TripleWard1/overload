// lib/db.ts
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc as fsDeleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  await setDoc(ref, data, { merge: true });
}

export async function deleteUserDoc(
  uid: string,
  collectionName: string,
  id: string
): Promise<void> {
  const ref = doc(db, "users", uid, collectionName, id);
  await fsDeleteDoc(ref);
}
