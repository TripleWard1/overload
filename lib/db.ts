import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    serverTimestamp,
  } from "firebase/firestore";
  import { db } from "@/lib/firebase";
  
  // Guarda JSON (session/weight/template) com id fixo
  export async function upsertUserDoc<T extends { id: string }>(
    uid: string,
    colName: "sessions" | "weights" | "templates" | "exerciseStats",
    item: T
  ) {
    const ref = doc(db, "users", uid, colName, item.id);
    await setDoc(
      ref,
      { ...item, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }
  
  export async function deleteUserDoc(
    uid: string,
    colName: "sessions" | "weights" | "templates" | "exerciseStats",
    id: string
  ) {
    const ref = doc(db, "users", uid, colName, id);
    await deleteDoc(ref);
  }
  
  export async function loadUserCollection<T>(
    uid: string,
    colName: "sessions" | "weights" | "templates" | "exerciseStats"
  ): Promise<T[]> {
    const colRef = collection(db, "users", uid, colName);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as T);
  }
  