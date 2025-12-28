import { useState } from "react";

/* ---------------- MOCK DATA ---------------- */

const TERMS = ["Term 1", "Term 2", "Term 3"];
const GRADES = ["All", "9", "10", "11", "12"];

const MOCK_LEARNERS = [
  {
    id: 1,
    name: "Thabo Mokoena",
    grade: "10",
    parent: "Mrs Mokoena",
    phone: "0712345678",
    school: "Parktown High",
    averages: [45, 58, 72],
    strengths: "Algebra, Graphs",
    weaknesses: "Word problems",
    career: "Engineering",
    attendance: [true, true, false, true, true],
  },
  {
    id: 2,
    name: "Anele Dlamini",
    grade: "11",
    parent: "Ms Dlamini",
    phone: "0729988776",
    school: "Soweto Science School",
    averages: [62, 66, 69],
    strengths: "Trigonometry",
    weaknesses: "Chemistry calculations",
    career: "Medicine",
    attendance: [true, true, true, true, true],
  },
  {
    id: 3,
    name: "Sipho Nkosi",
    grade: "9",
    parent: "Mrs Nkosi",
    phone: "0784455667",
    school: "King Edward VII",
    averages: [38, 42, 48],
    strengths: "Geometry",
    weaknesses: "Foundations",
    career: "Architecture",
    attendance: [false, true, false, true, false],
  },
];

/* ---------------- HELPERS ---------------- */

const statusColor = (avg) =>
  avg < 50 ? "bg-red-500" : avg < 65 ? "bg-yellow-400" : "bg-green-500";

// Normalize grade input to "9"/"10"/"11"/"12" (supports "10", "Grade 10", " 10 ", etc.)
const normalizeGrade = (value) => {
  const digits = String(value || "").match(/\d+/g);
  if (!digits) return "";
  const grade = digits.join(""); // in case someone types "1 0"
  return grade;
};

/* ---------------- MAIN ---------------- */

export default function AdminDashboard() {
  // ✅ CHANGE: learners is now stateful so we can add new learners
  const [learners, setLearners] = useState(MOCK_LEARNERS);

  const [term, setTerm] = useState(1);
  const [gradeFilter, setGradeFilter] = useState("All");
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState(null);

  /* -------- Register Learner State (NEW) -------- */
  const [newLearnerName, setNewLearnerName] = useState("");
  const [newLearnerGrade, setNewLearnerGrade] = useState("");
  const [newParentPhone, setNewParentPhone] = useState("");
  const [createError, setCreateError] = useState("");

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

  const averages = learners.map((l) => l.averages[term - 1]);
  const classAverage =
    averages.length === 0
      ? 0
      : Math.round(averages.reduce((a, b) => a + b, 0) / averages.length);

  const filteredLearners =
    gradeFilter === "All"
      ? learners
      : learners.filter((l) => l.grade === gradeFilter);

  /* -------- Create Learner Handler (NEW) -------- */

  const handleCreateLearner = () => {
    setCreateError("");

    const name = newLearnerName.trim();
    const gradeNormalized = normalizeGrade(newLearnerGrade.trim());
    const phone = newParentPhone.trim();

    // Validate required fields
    if (!name || !gradeNormalized || !phone) {
      setCreateError("Please fill in Learner name, Grade, and Parent phone number.");
      return;
    }

    // Validate grade is one of our supported grades (9-12)
    const allowedGrades = GRADES.filter((g) => g !== "All");
    if (!allowedGrades.includes(gradeNormalized)) {
      setCreateError("Grade must be 9, 10, 11, or 12.");
      return;
    }

    const newLearner = {
      id: Date.now(),
      name,
      grade: gradeNormalized,
      parent: "Parent",
      phone,
      school: "Not specified",
      averages: [0, 0, 0],
      strengths: "—",
      weaknesses: "—",
      career: "—",
      attendance: [false, false, false, false, false],
    };

    setLearners((prev) => [...prev, newLearner]);

    // Clear form
    setNewLearnerName("");
    setNewLearnerGrade("");
    setNewParentPhone("");

    // Show success popup (your existing popup)
    setShowSuccess(true);
  };

  const canCreate =
    newLearnerName.trim() && newLearnerGrade.trim() && newParentPhone.trim();

  return (
    <div className="min-h-screen bg-gray-50 p-10 space-y-12">
      <h1 className="text-3xl font-semibold text-navy">Admin Dashboard</h1>

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
            <h2 className="text-xl font-medium">📝 Focus This Week</h2>

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
              🔗 Lesson Planning
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
              📘 Tutor Notes
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
              🎯 Weekly Goals
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
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-medium">Class Performance</h2>

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

        <svg viewBox="0 0 300 120" className="w-full h-40">
          <rect x="0" y="60" width="300" height="60" fill="#fee2e2" />
          <rect x="0" y="0" width="300" height="40" fill="#dcfce7" />

          {averages.map((v, i) => (
            <circle
              key={i}
              cx={50 + i * 80}
              cy={120 - v}
              r="4"
              fill="#c9a227"
            />
          ))}
        </svg>

        <p className="text-sm mt-2">
          Class average: <strong>{classAverage}%</strong>
        </p>
      </section>

      {/* ---------------- ATTENDANCE SNAPSHOT (ONLY UPDATED WITH M T W T F) ---------------- */}
      <section className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-medium mb-4">
          📅 Attendance Snapshot (This Week)
        </h2>

        {/* ✅ NEW: Day labels row (M T W T F) aligned with dots */}
        <div className="flex justify-end mb-2">
          <div className="flex gap-2">
            {["M", "T", "W", "T", "F"].map((day, i) => (
              <span
                key={i}
                className="w-3 text-xs text-gray-500 text-center"
              >
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
                    title={present ? "Attended" : "Absent"}
                    className={`w-3 h-3 rounded-full ${
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
          <h2 className="text-xl font-medium">Learners</h2>

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

        <ul className="space-y-3">
          {filteredLearners.map((l) => (
            <li
              key={l.id}
              onClick={() => setSelectedLearner(l)}
              className="flex justify-between items-center p-3 border rounded cursor-pointer hover:bg-gray-50"
            >
              {l.name} (Grade {l.grade})
              <span
                className={`w-3 h-3 rounded-full ${statusColor(
                  l.averages[term - 1]
                )}`}
              />
            </li>
          ))}
        </ul>
      </section>

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
              onClick={() => setSelectedLearner(null)}
              className="absolute top-2 right-3"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-2">
              {selectedLearner.name}
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Grade {selectedLearner.grade} — {selectedLearner.school}
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
          </div>
        </div>
      )}
    </div>
  );
}
