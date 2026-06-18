// src/firebase/firestore.js

import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

/* ===============================
   👨‍👩‍👧 PARENTS
================================ */

/**
 * Get parent by phone number
 */
export const getParentByPhone = async (phone) => {
  const q = query(collection(db, "parents"), where("phone", "==", phone));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  };
};

/**
 * Create parent (if not exists)
 */
export const createParent = async ({ phone, name, email }) => {
  const ref = doc(collection(db, "parents"));
  await setDoc(ref, {
    phone,
    name,
    email,
    learners: [],
    createdAt: serverTimestamp(),
  });

  return ref.id;
};

/* ===============================
   🎓 LEARNERS
================================ */

export async function getLearnerByParentPhone(phone) {
  const q = query(
    collection(db, "learners"),
    where("parentPhone", "==", phone)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const data = snapshot.docs[0].data();

  // 🔒 SAFETY NORMALIZATION (VERY IMPORTANT)
  return {
    learnerName: data.learnerName || "Unknown learner",
    grade: data.grade || "Unknown grade",

    weekSummary: data.weekSummary || "No summary yet.",

    homework: {
      completedThisWeek: data.homework?.completedThisWeek ?? 0,
      missedThisWeek: data.homework?.missedThisWeek ?? 0,
      streakDays: data.homework?.streakDays ?? 0,
    },

    upcomingTasks: Array.isArray(data.upcomingTasks)
      ? data.upcomingTasks
      : [],

    topics: Array.isArray(data.topics)
      ? data.topics
      : [],

    tutorNotes: Array.isArray(data.tutorNotes)
      ? data.tutorNotes
      : [],
  };
}


export const getLearnerById = async (learnerId) => {
  const ref = doc(db, "learners", learnerId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  };
};

/* ===============================
   📊 PROGRESS
================================ */

export const getProgressByLearnerId = async (learnerId) => {
  const ref = doc(db, "progress", learnerId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;
  return snap.data();
};

export const updateProgress = async (learnerId, progressData) => {
  const ref = doc(db, "progress", learnerId);
  await setDoc(
    ref,
    {
      ...progressData,
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  );
};

/* ===============================
   📝 TUTOR NOTES
================================ */

export const addTutorNote = async ({
  learnerId,
  tutorName,
  note,
  recommendation,
}) => {
  const ref = doc(collection(db, "notes"));
  await setDoc(ref, {
    learnerId,
    tutorName,
    note,
    recommendation,
    createdAt: serverTimestamp(),
  });
};

export const getNotesByLearnerId = async (learnerId) => {
  const q = query(
    collection(db, "notes"),
    where("learnerId", "==", learnerId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
