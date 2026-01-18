/* Importing Necessary Data: 
   useState = memory
   useEffect = side effects (e.g., localStorage)
*/
import { useEffect, useState } from "react";

/* Creating a unique label for each month in the format YYYY-MM */
const getCurrentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/* Current month key and label */
const CURRENT_MONTH_KEY = getCurrentMonthKey();

const mapLearnerFromDb = (row) => ({
  id: row.id,
  name: row.name,
  grade: String(row.grade ?? ""),
  parent: row.parent_name ?? "Not specified",
  phone: row.parent_phone ?? "",
  school: row.school ?? "Not specified",
  averages: [0, 0, 0], // keep your UI working for now
  strengths: row.strengths ?? "—",
  weaknesses: row.weaknesses ?? "—",
  career: row.career ?? "—",
  attendance: [false, false, false, false, false], // until we wire attendance table
  attendanceByDate: {},
  payments: { [CURRENT_MONTH_KEY]: false }, // until we wire payments table
});

/* ---------------- MOCK DATA ---------------- */
/* Creating constant (never changes) list of things to use in system */
const TERMS = ["Term 1", "Term 2", "Term 3", "Term 4"];
const GRADES = ["All", "9", "10", "11", "12"];

/* ---------------- Month helpers (for monthly payments tracking) ---------------- */
const CURRENT_MONTH_LABEL = new Date().toLocaleString("default", {
  month: "long",
  year: "numeric",
});

/* ---------------- MOCK LEARNERS ---------------- */
/* Sample data for learners */


/* ---------------- HELPERS ---------------- */
/* Determine color based on average score */
const statusColor = (avg) =>
  avg < 50 ? "bg-red-500" : avg < 65 ? "bg-yellow-400" : "bg-green-500";

// Normalizing grade input to "9"/"10"/"11"/"12" (supports "10", "Grade 10", " 10 ", etc.)
const normalizeGrade = (value) => {
  const digits = String(value || "").match(/\d+/g);
  if (!digits) return "";
  const grade = digits.join(""); // in case someone types "1 0"
  return grade;
};

/* -------- PHASE 1: Week Date Helpers -------- */
// Returns Monday → Friday (YYYY-MM-DD)
const getWeekDates = () => {
  const today = new Date();
  const day = today.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);

  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
};

const WEEK_DATES = getWeekDates();

/* -------- PHASE 2: Local Storage (demo data) -------- */


/* -------- PHASE 2: Monthly Calendar Helpers -------- */
const getMonthDays = (year, month) => {
  const days = [];
  const d = new Date(year, month, 1);

  while (d.getMonth() === month) {
    const day = d.getDay(); // 0 Sun, 6 Sat
    if (day !== 0 && day !== 6) {
      days.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }

  return days;
};

const formatDateKey = (date) =>
  date.toISOString().split("T")[0];

/* ---------------- MAIN ---------------- */

export default function AdminDashboard() {

  /* -------- Class Performance State -------- */
  const [term, setTerm] = useState(1);
  const [gradeFilter, setGradeFilter] = useState("All");
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedLearnerId, setSelectedLearnerId] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [removeNotice, setRemoveNotice] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [removeMode, setRemoveMode] = useState(false);
  const [learners, setLearners] = useState([]);
  const [loadingLearners, setLoadingLearners] = useState(true);
  const [loadError, setLoadError] = useState("");

  /* -------- Load Marks -------- */
  const selectedLearner = learners.find(
    (l) => l.id === selectedLearnerId
  );
  const [showMarksEditor, setShowMarksEditor] = useState(false);
  const [assessments, setAssessments] = useState([
    { id: 1, label: "Test 1", marks: {} },
  ]);

  /* -------- Register Learner State (NEW) -------- */

  const [newLearnerName, setNewLearnerName] = useState("");
  const [newLearnerGrade, setNewLearnerGrade] = useState("");
  const [newParentPhone, setNewParentPhone] = useState("");
  const [newParentName, setNewParentName] = useState("");
  const [newSchool, setNewSchool] = useState("");
  const [newStrengths, setNewStrengths] = useState("");
  const [newWeaknesses, setNewWeaknesses] = useState("");
  const [createError, setCreateError] = useState("");


  useEffect(() => {
  (async () => {
    try {
      setLoadError("");
      setLoadingLearners(true);

      const res = await fetch("/.netlify/functions/get-learners");
      if (!res.ok) throw new Error(`Failed to load learners (${res.status})`);

      const data = await res.json();
      setLearners((Array.isArray(data) ? data : []).map(mapLearnerFromDb));
    } catch (err) {
      setLoadError(err.message || "Failed to load learners");
    } finally {
      setLoadingLearners(false);
    }
  })();
}, []);


  /* -------- Focus This Week State -------- */
  const [editingFocus, setEditingFocus] = useState(false);
  const [focus, setFocus] = useState({
    topics: [
      "Grade 10 Maths Algebra revision",
      "Grade 9 Science Practical skills",
    ],
    lessonPlan: "Revise core concepts and exam techniques",
    tutorNotes: "Pay attention to weak algebra foundations",
    weeklyGoals: "Improve class average by 5%",
  });

  const averages = learners.map((l) => {
  let total = 0;
  let count = 0;

  assessments.forEach((a) => {
    const mark = a.marks[l.id];
    if (typeof mark === "number") {
      total += mark;
      count++;
    }
  });

  return count === 0 ? 0 : Math.round(total / count);
});

  const classAverage =
    averages.length === 0
      ? 0
      : Math.round(averages.reduce((a, b) => a + b, 0) / averages.length);

  const filteredLearners =
    gradeFilter === "All"
      ? learners
      : learners.filter((l) => l.grade === gradeFilter);

  /* -------- Create Learner Handler -------- */
  const handleCreateLearner = async () => {
  setCreateError("");

  const name = newLearnerName.trim();
  const gradeNormalized = normalizeGrade(newLearnerGrade.trim());
  const phone = newParentPhone.trim();

  if (!name || !gradeNormalized || !phone) {
    setCreateError("Please fill in Learner name, Grade, and Parent phone number.");
    return;
  }

  const allowedGrades = GRADES.filter((g) => g !== "All");
  if (!allowedGrades.includes(gradeNormalized)) {
    setCreateError("Grade must be 9, 10, 11, or 12.");
    return;
  }

  const payload = {
    name,
    grade: Number(gradeNormalized),                 // DB expects INT
    school: newSchool.trim() || "Not specified",
    parent_name: newParentName.trim() || "Not specified",
    parent_phone: phone,
    strengths: newStrengths.trim() || "—",
    weaknesses: newWeaknesses.trim() || "—",
    career: "—",
  };

  try {
    const res = await fetch("/.netlify/functions/create-learner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Failed to create learner");
    }

    const created = await res.json();

    setLearners((prev) => [...prev, mapLearnerFromDb(created)]);

    // Clear form
    setNewLearnerName("");
    setNewLearnerGrade("");
    setNewParentPhone("");
    setNewParentName("");
    setNewSchool("");
    setNewStrengths("");
    setNewWeaknesses("");
    setShowSuccess(true);
  } catch (err) {
    setCreateError(err.message || "Failed to create learner");
  }
};


  const confirmRemoveLearner = () => {
  if (!pendingRemoval) return;

  const learnerId = pendingRemoval.id;

  setLearners((prev) => prev.filter((l) => l.id !== learnerId));
  setPendingRemoval(null);
  setRemoveMode(false);
  if (selectedLearnerId === learnerId) {
    setSelectedLearnerId(null);
  }
};

  /* -------- PHASE 1: Attendance Toggle (click dots) -------- */
  const toggleAttendance = async (learnerId, date) => {
  try {
    await fetch("/.netlify/functions/set-attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        learnerId,
        date,
        present: true, // or toggle based on existing state
      }),
    });

    // After save → reload attendance from DB
    await loadAttendance();
  } catch (err) {
    console.error("Failed to save attendance", err);
  }
};


  const canCreate =
    newLearnerName.trim() && newLearnerGrade.trim() && newParentPhone.trim();

  /* Payment Status Handler (Paid / Not Paid per month) */
  const handlePaymentChange = (learnerId, value) => {
    setLearners((prev) =>
      prev.map((l) => {
        if (l.id !== learnerId) return l;

        ;
      })
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10 space-y-12">
      {/* header includes month badge */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-navy">Admin Dashboard</h1>

        {/* Month/Date Display */}
        <span className="text-sm px-4 py-1 rounded-full bg-gold text-navy font-semibold">
          Payments for {CURRENT_MONTH_LABEL}
        </span>
        {loadingLearners && (
            <p className="text-sm text-gray-500">Loading learners…</p>
          )}

          {loadError && (
            <p className="text-sm text-red-600">{loadError}</p>
          )}
      </div>

      {/* ---------------- TOP GRID ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ---------------- REGISTER LEARNER ---------------- */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="text-xl font-medium">Register Learner</h2>

          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Learner full name"
            value={newLearnerName}
            onChange={(e) => {
              setNewLearnerName(e.target.value);
              if (createError) setCreateError("");
            }}
          />
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Grade"
            value={newLearnerGrade}
            onChange={(e) => {
              setNewLearnerGrade(e.target.value);
              if (createError) setCreateError("");
            }}
          />
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Parent phone number"
            value={newParentPhone}
            onChange={(e) => {
              setNewParentPhone(e.target.value);
              if (createError) setCreateError("");
            }}
          />

          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Parent name & surname"
            value={newParentName}
            onChange={(e) => {
              setNewParentName(e.target.value);
              if (createError) setCreateError("");
            }}
          />

          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="School"
            value={newSchool}
            onChange={(e) => {
              setNewSchool(e.target.value);
              if (createError) setCreateError("");
            }}
          />

          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Strengths (e.g. Algebra, Geometry)"
            value={newStrengths}
            onChange={(e) => setNewStrengths(e.target.value)}
          />

          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Weaknesses (e.g. Word problems)"
            value={newWeaknesses}
            onChange={(e) => setNewWeaknesses(e.target.value)}
          />



          {createError ? (
            <p className="text-sm text-red-600">{createError}</p>
          ) : null}

          <button
            onClick={handleCreateLearner}
            className={`bg-gold text-navy px-4 py-2 rounded font-semibold ${
              canCreate ? "" : "opacity-60"
            }`}
          >
            Create Learner
          </button>
        </div>

        {/* ---------------- FOCUS THIS WEEK ---------------- */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 p-6 rounded-xl shadow-lg space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium"> Focus This Week</h2>

            <button
              onClick={() => setEditingFocus(!editingFocus)}
              className="text-sm text-gold font-semibold hover:underline"
            >
              {editingFocus ? "Save" : "Edit"}
            </button>
          </div>

          {/* Focus Topics */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Focus Topics
            </h3>

            {editingFocus ? (
              <textarea
                value={focus.topics.join("\n")}
                onChange={(e) =>
                  setFocus({ ...focus, topics: e.target.value.split("\n") })
                }
                rows={3}
                className="w-full border rounded p-2 text-sm"
              />
            ) : (
              <ul className="space-y-1 text-sm">
                {focus.topics.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-gold">•</span>
                    {t}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Lesson Planning */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Lesson Planning
            </h3>

            {editingFocus ? (
              <textarea
                value={focus.lessonPlan}
                onChange={(e) =>
                  setFocus({ ...focus, lessonPlan: e.target.value })
                }
                className="w-full border rounded p-2 text-sm"
              />
            ) : (
              <p className="text-sm text-gray-600">{focus.lessonPlan}</p>
            )}
          </div>

          {/* Tutor Notes */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Tutor Notes
            </h3>

            {editingFocus ? (
              <textarea
                value={focus.tutorNotes}
                onChange={(e) =>
                  setFocus({ ...focus, tutorNotes: e.target.value })
                }
                className="w-full border rounded p-2 text-sm"
              />
            ) : (
              <p className="text-sm text-gray-600">{focus.tutorNotes}</p>
            )}
          </div>

          {/* Weekly Goals */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Weekly Goals
            </h3>

            {editingFocus ? (
              <textarea
                value={focus.weeklyGoals}
                onChange={(e) =>
                  setFocus({ ...focus, weeklyGoals: e.target.value })
                }
                className="w-full border rounded p-2 text-sm"
              />
            ) : (
              <p className="text-sm text-gray-600">{focus.weeklyGoals}</p>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- CLASS PERFORMANCE ---------------- */}
      <section className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">Class Performance</h2>

          <div className="flex gap-3">
            <button
              onClick={() => setShowMarksEditor(!showMarksEditor)}
              className="px-4 py-1 rounded bg-gold text-navy font-semibold text-sm"
            >
              Load Marks
            </button>

            <select
              value={term}
              onChange={(e) => setTerm(Number(e.target.value))}
              className="border px-3 py-1 rounded"
            >
              {TERMS.map((t, i) => (
                <option key={i} value={i + 1}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>


        <svg viewBox="0 0 300 120" className="w-full h-40">
          <rect x="0" y="60" width="300" height="60" fill="#fee2e2" />
          <rect x="0" y="0" width="300" height="40" fill="#dcfce7" />

          {averages.map((v, i) => (
            <circle key={i} cx={50 + i * 80} cy={120 - v} r="4" fill="#c9a227" />
          ))}
        </svg>
      {showMarksEditor && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-2 text-left">Learner</th>

                {assessments.map((a) => (
                  <th key={a.id} className="border px-3 py-2">
                    <input
                      value={a.label}
                      onChange={(e) =>
                        setAssessments((prev) =>
                          prev.map((x) =>
                            x.id === a.id ? { ...x, label: e.target.value } : x
                          )
                        )
                      }
                      className="border px-2 py-1 rounded w-24 text-center"
                    />
                  </th>
                ))}

                <th className="border px-3 py-2">
                  <button
                    onClick={() =>
                      setAssessments((prev) => [
                        ...prev,
                        { id: Date.now(), label: "New", marks: {} },
                      ])
                    }
                    className="text-gold font-semibold"
                  >
                    + Add
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              {learners.map((l) => (
                <tr key={l.id}>
                  <td className="border px-3 py-2 font-medium">
                    {l.name}
                  </td>

                  {assessments.map((a) => (
                    <td key={a.id} className="border px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={a.marks[l.id] ?? ""}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setAssessments((prev) =>
                            prev.map((x) =>
                              x.id === a.id
                                ? {
                                    ...x,
                                    marks: {
                                      ...x.marks,
                                      [l.id]: value,
                                    },
                                  }
                                : x
                            )
                          );
                        }}
                        className="w-16 border rounded px-2 py-1 text-center"
                      />
                    </td>
                  ))}

                  <td className="border px-3 py-2 text-center text-gray-400">
                    %
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

        <p className="text-sm mt-2">
          Class average: <strong>{classAverage}%</strong>
        </p>
      </section>

      {/* ---------------- ATTENDANCE SNAPSHOT (ONLY UPDATED WITH M T W T F) ---------------- */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-medium mb-4">
          Attendance Snapshot (This Week)
        </h2>

        {/* Day labels row (M T W T F) aligned with dots */}
        <div className="flex justify-end mb-2">
          <div className="flex gap-2">
            {["M", "T", "W", "T", "F"].map((day, i) => (
              <span key={i} className="w-3 text-xs text-gray-500 text-center">
                {day}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredLearners.map((l) => (
            <div key={l.id} className="flex justify-between items-center">
              <span className="text-sm font-medium">
                {l.name} (Grade {l.grade})
              </span>

              <div className="flex gap-2">
                {l.attendance.map((present, i) => (
                  <span
                    key={i}
                    onClick={() => toggleAttendance(l.id, i)}
                    title={present ? "Attended" : "Absent"}
                    className={`w-3 h-3 rounded-full cursor-pointer ${
                      present ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- LEARNERS ---------------- */}
      <section className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-4">
          {/* Left */}
          <h2 className="text-xl font-medium">Learners</h2>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setRemoveMode(!removeMode);
                setRemoveNotice(!removeMode);
              }}
              className={`px-4 py-1 rounded text-sm font-semibold transition
                ${
                  removeMode
                    ? "bg-red-700 text-white shadow-lg scale-105"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
            >
              {removeMode ? "Cancel Remove" : "Remove Learner"}
            </button>

            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="border px-3 py-1 rounded"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g === "All" ? "All Grades" : `Grade ${g}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ul className="space-y-3">
          {filteredLearners.map((l) => {
            const paid = !!(l.payments && l.payments[CURRENT_MONTH_KEY]);

            return (
              <li
                  key={l.id}
                  onClick={() => {
                    if (removeMode) {
                      setPendingRemoval(l);
                    } else {
                      setSelectedLearnerId(l.id);
                    }
                  }}
                  className={`flex justify-between items-center p-3 border rounded cursor-pointer transition
                    ${
                      removeMode
                        ? "border-red-300 bg-red-50 animate-[shake_0.3s_ease-in-out_infinite]"
                        : "hover:bg-gray-50"
                    }`}
                >
                  {/* Learner name */}
                  <span
                    className={
                      paid
                        ? "text-green-600 font-medium"
                        : "text-red-600 font-medium"
                    }
                  >
                    {l.name} (Grade {l.grade})
                  </span>

                  {/* Payment status */}
                  <div className="flex items-center gap-3">
                    <select
                      value={paid ? "paid" : "unpaid"}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        handlePaymentChange(l.id, e.target.value);
                      }}
                      className="border px-2 py-1 rounded text-sm"
                    >
                      <option value="paid">Paid</option>
                      <option value="unpaid">Not Paid</option>
                    </select>


                    <span
                      className={`w-3 h-3 rounded-full ${
                        paid ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                  </div>
                </li>
            );
          })}
        </ul>
      </section>
      
      {/* ---------------- REMOVE LEARNER CONFIRMATION ---------------- */}
        {pendingRemoval && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md text-center relative">
              
              {/* Close */}
              <button
                onClick={() => setPendingRemoval(null)}
                className="absolute top-3 right-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>

              {/* Icon */}
              <div className="text-4xl mb-3">⚠️</div>

              {/* Message */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Remove learner?
              </h3>

              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to remove{" "}
                <strong className="text-red-600">
                  {pendingRemoval.name}
                </strong>
                ?<br />
                This action <strong>cannot be undone</strong>.
              </p>

              {/* Actions */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setPendingRemoval(null)}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmRemoveLearner}
                  className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                >
                  Yes, remove
                </button>
              </div>
            </div>
          </div>
        )}


      {/* ---------------- SUCCESS POPUP ---------------- */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white/80 backdrop-blur-lg p-6 rounded-xl shadow-xl text-center w-80 relative">
            <button
              onClick={() => setShowSuccess(false)}
              className="absolute top-2 right-3"
            >
              ✕
            </button>
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="font-semibold">Learner Created</h3>
            <p className="text-sm text-gray-600">
              The learner has been successfully added.
            </p>
          </div>
        </div>
      )}

      {/* ---------------- LEARNER MODAL ---------------- */}
      {selectedLearner && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-lg w-full relative">
            <button
              onClick={() => setSelectedLearnerId(null)}
              className="absolute top-2 right-3"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-2">
              {selectedLearner.name}
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Grade {selectedLearner.grade} {selectedLearner.school}
            </p>

            <p>
              <strong>Parent:</strong> {selectedLearner.parent}
            </p>
            <p>
              <strong>Phone:</strong> {selectedLearner.phone}
            </p>
            <p>
              <strong>Strengths:</strong> {selectedLearner.strengths}
            </p>
            <p>
              <strong>Weaknesses:</strong> {selectedLearner.weaknesses}
            </p>
            <p>
              <strong>Career:</strong> {selectedLearner.career}
            </p>
            {/* ---------------- PHASE 2: MONTHLY ATTENDANCE ---------------- */}
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  {/* Left */}
                  <h2 className="text-xl font-medium">Learners</h2>

                  {/* Right controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setRemoveMode(!removeMode);
                        setRemoveNotice(!removeMode);
                      }}
                      className={`px-4 py-1 rounded text-sm font-semibold transition
                        ${
                          removeMode
                            ? "bg-red-700 text-white shadow-lg scale-105"
                            : "bg-red-500 text-white hover:bg-red-600"
                        }`}
                    >
                      {removeMode ? "Cancel Remove" : "Remove Learner"}
                    </button>

                    <select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      className="border px-3 py-1 rounded"
                    >
                      {GRADES.map((g) => (
                        <option key={g} value={g}>
                          {g === "All" ? "All Grades" : `Grade ${g}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Day labels */}
                <div className="grid grid-cols-5 gap-2 text-center mb-1">
                  {["M", "T", "W", "T", "F"].map((d) => (
                    <span key={d} className="text-xs text-gray-500">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-5 gap-2 text-center">
                  {getMonthDays(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth()
                  ).map((date) => {
                    const key = formatDateKey(date);
                    const status = selectedLearner.attendanceByDate?.[key];

                    return (
                      <div key={key} className="flex flex-col items-center text-xs">
                        <span>{date.getDate()}</span>
                        <span
                          className={`w-2 h-2 rounded-full mt-1 ${
                            status === true
                              ? "bg-green-500"
                              : status === false
                              ? "bg-gray-400"
                              : "bg-gray-200"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Monthly summary */}
                {(() => {
                  const days = getMonthDays(
                    calendarMonth.getFullYear(),
                    calendarMonth.getMonth()
                  );

                  const attended = days.filter(
                    (d) => selectedLearner.attendanceByDate?.[formatDateKey(d)]
                  ).length;

                  const total = days.length;
                  const rate = total === 0 ? 0 : Math.round((attended / total) * 100);

                  return (
                    <div className="mt-4 text-sm text-gray-600">
                      <p>
                        Attended: <strong>{attended}</strong> / {total}
                      </p>
                      <p>
                        Attendance rate: <strong>{rate}%</strong>
                      </p>
                    </div>
                  );
                })()}
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
