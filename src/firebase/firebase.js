// src/firebase/firestore.js
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

/**
 * Fetch learner dashboard data by parent phone number
 */
export async function getLearnerByParentPhone(parentPhone) {
  if (!parentPhone) return null;

  const q = query(
    collection(db, "learners"),
    where("parentPhone", "==", parentPhone.trim())
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  // For now, return the first matched learner
  return snapshot.docs[0].data();
}
