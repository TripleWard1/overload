// lib/profile.ts
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type UserProfile = {
  uid: string;
  displayName: string;
  email?: string | null;
  updatedAt: string;
  createdAt: string;
};

// users/{uid}/profile/main
const profileRef = (uid: string) => doc(db, "users", uid, "profile", "main");

function makeDefaultName(uid: string, email?: string | null) {
  const base = (email || "").split("@")[0]?.trim();
  if (base && base.length >= 3) return base;
  const short = uid.slice(0, 4).toUpperCase();
  const num = String(Math.floor(Math.random() * 9000) + 1000);
  return `Atleta ${short}-${num}`;
}

export async function getOrCreateUserProfile(uid: string, email?: string | null) {
  const ref = profileRef(uid);
  const snap = await getDoc(ref);

  if (snap.exists()) return snap.data() as UserProfile;

  const now = new Date().toISOString();
  const profile: UserProfile = {
    uid,
    email: email ?? null,
    displayName: makeDefaultName(uid, email),
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(ref, profile, { merge: true }); // aqui está OK porque usas null e não undefined

  return profile;
}

export async function updateUserDisplayName(uid: string, displayName: string) {
  const now = new Date().toISOString();
  await setDoc(
    profileRef(uid),
    { displayName: displayName.trim(), updatedAt: now },
    { merge: true }
  );
}
