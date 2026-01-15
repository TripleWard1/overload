// lib/rankings.ts
import {
    collectionGroup,
    getDocs,
    limit,
    query,
    where,
    orderBy,
    doc,
    getDoc,
  } from "firebase/firestore";
  import { db } from "@/lib/firebase";
  
  export type RankingRow = {
    uid: string;
    displayName: string;
    bestWeight?: number;
    bestReps?: number;
  };
  
  function uidFromExerciseStatsPath(path: string) {
    // "users/{uid}/exerciseStats/{docId}"
    const parts = path.split("/");
    const idx = parts.indexOf("users");
    return idx >= 0 ? parts[idx + 1] : "";
  }
  
  async function getDisplayName(uid: string) {
    // users/{uid}/profile/main
    const ref = doc(db, "users", uid, "profile", "main");
    const snap = await getDoc(ref);
    const data: any = snap.exists() ? snap.data() : null;
    return (data?.displayName as string) || `Atleta ${uid.slice(0, 4).toUpperCase()}`;
  }
  
  export async function fetchExerciseRanking(normalizedName: string, take = 20) {
    // collectionGroup: exerciseStats em todos os users
    const q = query(
      collectionGroup(db, "exerciseStats"),
      where("normalizedName", "==", normalizedName),
      orderBy("bestWeight", "desc"),
      limit(take)
    );
  
    const snap = await getDocs(q);
  
    const rowsRaw = snap.docs.map((d) => {
      const data: any = d.data();
      const uid = uidFromExerciseStatsPath(d.ref.path);
      return {
        uid,
        bestWeight: data?.bestWeight,
        bestReps: data?.bestReps,
      };
    });
  
    // buscar displayName (fazemos cache simples)
    const cache = new Map<string, string>();
    const out: RankingRow[] = [];
  
    for (const r of rowsRaw) {
      if (!r.uid) continue;
      if (!cache.has(r.uid)) {
        cache.set(r.uid, await getDisplayName(r.uid));
      }
      out.push({
        uid: r.uid,
        displayName: cache.get(r.uid)!,
        bestWeight: r.bestWeight,
        bestReps: r.bestReps,
      });
    }
  
    return out;
  }
  