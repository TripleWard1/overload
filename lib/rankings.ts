// lib/rankings.ts
import { collection, doc, getDocs, limit, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type RankingRow = {
  uid: string;
  displayName: string;
  bestWeight?: number;
  bestReps?: number;
  updatedAt?: string;
};

export async function upsertRankingRow(args: {
  uid: string;
  exerciseId: string;          // ex: "bench_press"
  displayName: string;         // ex: "Hugo Barros"
  bestWeight?: number;
  bestReps?: number;
}) {
  const ref = doc(db, "rankings", args.exerciseId, "rows", args.uid);

  await setDoc(
    ref,
    {
      uid: args.uid,
      displayName: args.displayName || `Atleta ${args.uid.slice(0, 4).toUpperCase()}`,
      bestWeight: typeof args.bestWeight === "number" ? args.bestWeight : null,
      bestReps: typeof args.bestReps === "number" ? args.bestReps : null,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function fetchExerciseRanking(exerciseId: string, take = 20) {
  const q = query(
    collection(db, "rankings", exerciseId, "rows"),
    orderBy("bestWeight", "desc"),
    limit(take)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => d.data() as RankingRow);
}
