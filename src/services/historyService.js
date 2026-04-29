import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../lib/firebase";

// Save one calculation under the current user's history
export async function saveCalculation({
  userId,
  type,
  title,
  summary,
  inputs,
  outputs,
}) {
  if (!isFirebaseConfigured || !db || !userId) {
    throw new Error("Firebase not configured");
  }

  return addDoc(collection(db, "users", userId, "calculations"), {
    type,
    title,
    summary,
    inputs,
    outputs,
    createdAt: serverTimestamp(),
  });
}

// Delete one saved calculation by document id
export async function deleteCalculation({ userId, calculationId }) {
  if (!isFirebaseConfigured || !db || !userId || !calculationId) {
    throw new Error("Firebase not configured");
  }

  return deleteDoc(doc(db, "users", userId, "calculations", calculationId));
}

// Live subscription used by history lists and history page
export function subscribeToCalculations({ userId, type, onData, onError }) {
  if (!isFirebaseConfigured || !db || !userId) {
    onData([]);
    return () => {};
  }

  const q = query(
    collection(db, "users", userId, "calculations"),
    orderBy("createdAt", "desc"),
    limit(type ? 12 : 16),
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((snap) => ({
          id: snap.id,
          ...snap.data(),
        }))
        .filter((item) => !type || item.type === type);

      onData(items);
    },
    onError,
  );
}
