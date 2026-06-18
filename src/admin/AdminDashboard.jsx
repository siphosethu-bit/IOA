import { useCallback, useEffect, useMemo, useState } from "react";

const GRADES = ["All", "9", "10", "11", "12"];
const TERMS = [1, 2, 3, 4];
const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"];

const emptyLearnerForm = {
  name: "",
  grade: "",
  parentPhone: "",
  parentName: "",
  school: "",
  strengths: "",
  weaknesses: "",
};

const defaultFocus = {
  focusTopics: "",
  lessonPlan: "",
  tutorNotes: "",
  weeklyGoals: "",
};

const todayKey = () => formatDateKey(new Date());

const currentMonthKey = () => todayKey().slice(0, 7);

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMondayKey(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDateKey(d);
}

function getWeekDates(mondayKey) {
  const monday = new Date(`${mondayKey}T00:00:00`);
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return formatDateKey(date);
  });
}

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
}

function shortDateLabel(dateKey) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("default", {
    weekday: "short",
    day: "numeric",
  });
}

function normalizeGrade(value) {
  const match = String(value || "").match(/\d+/);
  return match ? match[0] : "";
}

function mapLearnerFromDb(row) {
  const id = String(row.id ?? row.learner_id ?? row.learnerId ?? "").trim();

  return {
    id: id || null,
    name: row.name,
    grade: String(row.grade ?? ""),
    parent: row.parent_name || "Not specified",
    phone: row.parent_phone || "",
    school: row.school || "Not specified",
    strengths: row.strengths || "Not specified",
    weaknesses: row.weaknesses || "Not specified",
    career: row.career || "Not specified",
  };
}

async function apiJson(path, options = {}) {
  const response = await fetch(path, options);
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    const preview = text.slice(0, 80);
    throw new Error(
      `Expected JSON from ${path}, but received ${preview || "an empty response"}`
    );
  }

  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || `Request failed with status ${response.status}`);
  }

  return data;
}

function learnerAverage(learnerId, marks) {
  const learnerMarks = marks.filter((mark) => String(mark.learner_id) === String(learnerId));
  if (!learnerMarks.length) return null;

  const total = learnerMarks.reduce((sum, mark) => sum + Number(mark.percentage || 0), 0);
  return Math.round(total / learnerMarks.length);
}

function attendanceKey(learnerId, date) {
  return `${learnerId}-${date}`;
}

function statusTone(status) {
  if (status === "paid" || status === "present") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "late") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "excused") return "bg-sky-50 text-sky-700 border-sky-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

export default function AdminDashboard() {
  const [learners, setLearners] = useState([]);
  const [payments, setPayments] = useState({});
  const [attendance, setAttendance] = useState({});
  const [marks, setMarks] = useState([]);
  const [focus, setFocus] = useState(defaultFocus);
  const [gradeFilter, setGradeFilter] = useState("All");
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [weekStartKey, setWeekStartKey] = useState(getMondayKey());
  const [term, setTerm] = useState(1);
  const [selectedLearner, setSelectedLearner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const weekDates = useMemo(() => getWeekDates(weekStartKey), [weekStartKey]);

  const loadLearners = useCallback(async () => {
    const data = await apiJson("/.netlify/functions/get-learners");
    setLearners(
      (Array.isArray(data) ? data : [])
        .map(mapLearnerFromDb)
        .filter((learner) => learner.id !== null)
    );
  }, []);

  const loadPayments = useCallback(async () => {
    const data = await apiJson(
      `/.netlify/functions/get-payments?monthKey=${encodeURIComponent(monthKey)}`
    );
    setPayments(
      Object.fromEntries((Array.isArray(data) ? data : []).map((row) => [row.learner_id, row.status]))
    );
  }, [monthKey]);

  const loadAttendance = useCallback(async () => {
    const data = await apiJson(
      `/.netlify/functions/get-attendance?from=${weekDates[0]}&to=${weekDates[4]}`
    );
    setAttendance(
      Object.fromEntries(
        (Array.isArray(data) ? data : []).map((row) => [
          attendanceKey(row.learner_id, row.attendance_date),
          row.status,
        ])
      )
    );
  }, [weekDates]);

  const loadMarks = useCallback(async () => {
    const data = await apiJson(`/.netlify/functions/get-marks?term=${term}`);
    setMarks(Array.isArray(data) ? data : []);
  }, [term]);

  const loadFocus = useCallback(async () => {
    const data = await apiJson(
      `/.netlify/functions/get-focus?weekKey=${encodeURIComponent(weekStartKey)}`
    );
    setFocus({
      focusTopics: data?.focus_topics || "",
      lessonPlan: data?.lesson_plan || "",
      tutorNotes: data?.tutor_notes || "",
      weeklyGoals: data?.weekly_goals || "",
    });
  }, [weekStartKey]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        await loadLearners();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadLearners]);

  useEffect(() => {
    loadPayments().catch((err) => setError(err.message));
  }, [loadPayments]);

  useEffect(() => {
    loadAttendance().catch((err) => setError(err.message));
    loadFocus().catch((err) => setError(err.message));
  }, [loadAttendance, loadFocus]);

  useEffect(() => {
    loadMarks().catch((err) => setError(err.message));
  }, [loadMarks]);

  const filteredLearners = useMemo(
    () =>
      gradeFilter === "All"
        ? learners
        : learners.filter((learner) => learner.grade === gradeFilter),
    [gradeFilter, learners]
  );

  const analytics = useMemo(() => {
    const averages = learners
      .map((learner) => learnerAverage(learner.id, marks))
      .filter((average) => average !== null);

    const classAverage =
      averages.length > 0
        ? Math.round(averages.reduce((sum, average) => sum + average, 0) / averages.length)
        : 0;

    const paymentPaid = learners.filter((learner) => payments[learner.id] === "paid").length;
    const attendanceTotal = learners.length * weekDates.length;
    const attendancePresent = learners.reduce(
      (sum, learner) =>
        sum +
        weekDates.filter((date) =>
          ["present", "late"].includes(attendance[attendanceKey(learner.id, date)])
        ).length,
      0
    );

    return {
      totalLearners: learners.length,
      classAverage,
      highestAverage: averages.length ? Math.max(...averages) : 0,
      lowestAverage: averages.length ? Math.min(...averages) : 0,
      supportCount: averages.filter((average) => average < 50).length,
      paymentPaid,
      paymentUnpaid: Math.max(learners.length - paymentPaid, 0),
      paymentRate: learners.length ? Math.round((paymentPaid / learners.length) * 100) : 0,
      attendanceRate: attendanceTotal
        ? Math.round((attendancePresent / attendanceTotal) * 100)
        : 0,
    };
  }, [attendance, learners, marks, payments, weekDates]);

  const handleCreateLearner = async (form) => {
    const grade = normalizeGrade(form.grade);

    if (!form.name.trim() || !grade || !form.parentPhone.trim()) {
      throw new Error("Learner name, grade, and parent phone number are required.");
    }

    if (!GRADES.filter((item) => item !== "All").includes(grade)) {
      throw new Error("Grade must be 9, 10, 11, or 12.");
    }

    await apiJson("/.netlify/functions/create-learner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        grade: Number(grade),
        school: form.school.trim() || "Not specified",
        parent_name: form.parentName.trim() || "Not specified",
        parent_phone: form.parentPhone.trim(),
        strengths: form.strengths.trim() || "Not specified",
        weaknesses: form.weaknesses.trim() || "Not specified",
        career: "Not specified",
      }),
    });

    await loadLearners();
    setNotice("Learner created and list refreshed.");
  };

  const handlePaymentChange = async (learnerId, status) => {
    const previous = payments;
    setPayments((current) => ({ ...current, [learnerId]: status }));

    try {
      await apiJson("/.netlify/functions/set-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId, monthKey, status }),
      });
      setNotice("Payment status saved.");
    } catch (err) {
      setPayments(previous);
      setError(err.message);
    }
  };

  const handleAttendanceChange = async (learnerId, date, status) => {
    const key = attendanceKey(learnerId, date);
    const previous = attendance;
    setAttendance((current) => ({ ...current, [key]: status }));

    try {
      await apiJson("/.netlify/functions/set-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learnerId, date, status, notes: "" }),
      });
    } catch (err) {
      setAttendance(previous);
      setError(err.message);
    }
  };

  const handleSaveMark = async (payload) => {
    await apiJson("/.netlify/functions/set-mark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, term }),
    });
    await loadMarks();
    setNotice("Mark saved.");
  };

  const handleSaveFocus = async (nextFocus) => {
    await apiJson("/.netlify/functions/set-focus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekKey: weekStartKey,
        focusTopics: nextFocus.focusTopics,
        lessonPlan: nextFocus.lessonPlan,
        tutorNotes: nextFocus.tutorNotes,
        weeklyGoals: nextFocus.weeklyGoals,
      }),
    });
    setFocus(nextFocus);
    setNotice("Weekly focus saved.");
  };

  return (
    <div className="min-h-screen bg-cream text-navy">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <DashboardHeader
          loading={loading}
          monthKey={monthKey}
          weekStartKey={weekStartKey}
          onMonthChange={setMonthKey}
          onWeekChange={setWeekStartKey}
        />

        {(notice || error) && (
          <StatusNotice
            type={error ? "error" : "success"}
            text={error || notice}
            onClose={() => {
              setNotice("");
              setError("");
            }}
          />
        )}

        <SummaryCards analytics={analytics} />

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <LearnerRegistrationCard onCreate={handleCreateLearner} />
          <FocusThisWeek focus={focus} weekStartKey={weekStartKey} onSave={handleSaveFocus} />
        </div>

        <PaymentTracker
          learners={learners}
          monthKey={monthKey}
          analytics={analytics}
          payments={payments}
          onChange={handlePaymentChange}
        />

        <LearnerList
          learners={filteredLearners}
          allLearnersCount={learners.length}
          gradeFilter={gradeFilter}
          onGradeFilterChange={setGradeFilter}
          payments={payments}
          attendance={attendance}
          weekDates={weekDates}
          marks={marks}
          onSelect={setSelectedLearner}
        />

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <AttendanceTracker
            learners={filteredLearners}
            weekDates={weekDates}
            attendance={attendance}
            onChange={handleAttendanceChange}
          />
          <MarksManager
            learners={filteredLearners}
            marks={marks}
            term={term}
            onTermChange={setTerm}
            onSaveMark={handleSaveMark}
          />
        </div>
      </div>

      {selectedLearner && (
        <LearnerModal
          learner={selectedLearner}
          paymentStatus={payments[selectedLearner.id] || "not_paid"}
          attendance={attendance}
          weekDates={weekDates}
          average={learnerAverage(selectedLearner.id, marks)}
          onClose={() => setSelectedLearner(null)}
        />
      )}
    </div>
  );
}

function DashboardHeader({ loading, monthKey, weekStartKey, onMonthChange, onWeekChange }) {
  return (
    <header className="overflow-hidden rounded-xl border border-white/70 bg-navy shadow-xl">
      <div className="grid gap-6 p-6 text-white lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
            Inevitable Online Academy
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
            Admin Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
            Manage learners, payments, attendance, marks, and weekly teaching focus from one calm workspace.
          </p>
        </div>

        <div className="grid gap-3 rounded-lg border border-white/10 bg-white/10 p-4 sm:grid-cols-2">
          <Field label="Payment month">
            <input
              type="month"
              value={monthKey}
              onChange={(event) => onMonthChange(event.target.value)}
              className="w-full rounded-md border border-white/20 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-gold"
            />
          </Field>
          <Field label="Week starts">
            <input
              type="date"
              value={weekStartKey}
              onChange={(event) => onWeekChange(getMondayKey(new Date(`${event.target.value}T00:00:00`)))}
              className="w-full rounded-md border border-white/20 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-gold"
            />
          </Field>
          <p className="sm:col-span-2 text-xs text-white/65">
            {loading ? "Loading academy data..." : `Viewing ${monthLabel(monthKey)} payments and this teaching week.`}
          </p>
        </div>
      </div>
    </header>
  );
}

function StatusNotice({ type, text, onClose }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 text-sm shadow-sm ${
        type === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      <span>{text}</span>
      <button type="button" onClick={onClose} className="font-semibold">
        Close
      </button>
    </div>
  );
}

function SummaryCards({ analytics }) {
  const cards = [
    ["Learners", analytics.totalLearners, "Active learner records"],
    ["Class average", `${analytics.classAverage}%`, "Across saved marks"],
    ["Highest average", `${analytics.highestAverage}%`, "Current term"],
    ["Needs support", analytics.supportCount, "Below 50 percent"],
    ["Attendance", `${analytics.attendanceRate}%`, "Present or late this week"],
    ["Collection", `${analytics.paymentRate}%`, "Paid for selected month"],
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map(([label, value, helper]) => (
        <div key={label} className="rounded-lg border border-white/70 bg-white/85 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-navy">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{helper}</p>
        </div>
      ))}
    </section>
  );
}

function Card({ title, subtitle, action, children }) {
  return (
    <section className="rounded-xl border border-white/70 bg-white/90 p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-xl font-semibold text-navy">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-navy outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/15"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-navy outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/15"
    />
  );
}

function LearnerRegistrationCard({ onCreate }) {
  const [form, setForm] = useState(emptyLearnerForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      await onCreate(form);
      setForm(emptyLearnerForm);
      setMessage("Learner created successfully.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title="Register Learner"
      subtitle="Create a clean learner record for admin tracking."
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Learner full name">
          <TextInput value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </Field>
        <Field label="Grade">
          <TextInput value={form.grade} onChange={(e) => update("grade", e.target.value)} placeholder="Grade 10" required />
        </Field>
        <Field label="Parent phone number">
          <TextInput value={form.parentPhone} onChange={(e) => update("parentPhone", e.target.value)} required />
        </Field>
        <Field label="Parent name and surname">
          <TextInput value={form.parentName} onChange={(e) => update("parentName", e.target.value)} />
        </Field>
        <Field label="School">
          <TextInput value={form.school} onChange={(e) => update("school", e.target.value)} />
        </Field>
        <Field label="Strengths">
          <TextInput value={form.strengths} onChange={(e) => update("strengths", e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Weaknesses">
            <TextArea rows={3} value={form.weaknesses} onChange={(e) => update("weaknesses", e.target.value)} />
          </Field>
        </div>

        <div className="flex items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-gold px-5 py-2 text-sm font-semibold text-navy shadow-sm transition hover:bg-[#b88f20] disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Create Learner"}
          </button>
          {message && <p className="text-sm text-gray-600">{message}</p>}
        </div>
      </form>
    </Card>
  );
}

function FocusThisWeek({ focus, weekStartKey, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(focus);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(focus);
  }, [focus]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Focus This Week"
      subtitle={`Week of ${shortDateLabel(weekStartKey)}`}
      action={
        <button
          type="button"
          onClick={() => (editing ? save() : setEditing(true))}
          disabled={saving}
          className="rounded-md border border-gold px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold hover:text-navy disabled:opacity-60"
        >
          {editing ? (saving ? "Saving..." : "Save Focus") : "Edit Focus"}
        </button>
      }
    >
      {editing ? (
        <div className="space-y-4">
          <Field label="Focus topics">
            <TextArea rows={3} value={draft.focusTopics} onChange={(e) => setDraft({ ...draft, focusTopics: e.target.value })} />
          </Field>
          <Field label="Lesson planning">
            <TextArea rows={3} value={draft.lessonPlan} onChange={(e) => setDraft({ ...draft, lessonPlan: e.target.value })} />
          </Field>
          <Field label="Tutor notes">
            <TextArea rows={3} value={draft.tutorNotes} onChange={(e) => setDraft({ ...draft, tutorNotes: e.target.value })} />
          </Field>
          <Field label="Weekly goals">
            <TextArea rows={3} value={draft.weeklyGoals} onChange={(e) => setDraft({ ...draft, weeklyGoals: e.target.value })} />
          </Field>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <FocusBlock label="Focus topics" value={focus.focusTopics} />
          <FocusBlock label="Lesson planning" value={focus.lessonPlan} />
          <FocusBlock label="Tutor notes" value={focus.tutorNotes} />
          <FocusBlock label="Weekly goals" value={focus.weeklyGoals} />
        </div>
      )}
    </Card>
  );
}

function FocusBlock({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-cream/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">
        {value || "Not set yet."}
      </p>
    </div>
  );
}

function PaymentTracker({ learners, monthKey, analytics, payments, onChange }) {
  return (
    <Card
      title="Monthly Payments"
      subtitle={`Payment tracking for ${monthLabel(monthKey)}. Saved to the database.`}
      action={
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <MiniStat label="Paid" value={analytics.paymentPaid} />
          <MiniStat label="Not paid" value={analytics.paymentUnpaid} />
          <MiniStat label="Rate" value={`${analytics.paymentRate}%`} />
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {learners.map((learner) => {
          const status = payments[learner.id] || "not_paid";
          return (
            <div key={learner.id} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy">{learner.name}</p>
                  <p className="text-xs text-gray-500">Grade {learner.grade}</p>
                </div>
                <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusTone(status)}`}>
                  {status === "paid" ? "Paid" : "Not paid"}
                </span>
              </div>
              <select
                value={status}
                onChange={(event) => onChange(learner.id, event.target.value)}
                className="mt-4 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gold"
              >
                <option value="paid">Paid</option>
                <option value="not_paid">Not paid</option>
              </select>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="min-w-20 rounded-md border border-gray-100 bg-white px-3 py-2">
      <p className="font-semibold text-navy">{value}</p>
      <p className="text-gray-500">{label}</p>
    </div>
  );
}

function LearnerList({
  learners,
  allLearnersCount,
  gradeFilter,
  onGradeFilterChange,
  payments,
  attendance,
  weekDates,
  marks,
  onSelect,
}) {
  return (
    <Card
      title="Learners"
      subtitle={`${learners.length} of ${allLearnersCount} learners shown. Use the grade filter for faster scanning.`}
      action={
        <select
          value={gradeFilter}
          onChange={(event) => onGradeFilterChange(event.target.value)}
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gold"
        >
          {GRADES.map((grade) => (
            <option key={grade} value={grade}>
              {grade === "All" ? "All grades" : `Grade ${grade}`}
            </option>
          ))}
        </select>
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
              <th className="py-3 pr-4">Learner</th>
              <th className="py-3 pr-4">Grade</th>
              <th className="py-3 pr-4">Payment</th>
              <th className="py-3 pr-4">Attendance</th>
              <th className="py-3 pr-4">Average</th>
              <th className="py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {learners.map((learner) => {
              const paid = payments[learner.id] === "paid";
              const average = learnerAverage(learner.id, marks);
              const attended = weekDates.filter((date) =>
                ["present", "late"].includes(attendance[attendanceKey(learner.id, date)])
              ).length;

              return (
                <tr key={learner.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-4 pr-4">
                    <p className="font-semibold text-navy">{learner.name}</p>
                    <p className="text-xs text-gray-500">{learner.parent}</p>
                  </td>
                  <td className="py-4 pr-4">Grade {learner.grade}</td>
                  <td className="py-4 pr-4">
                    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusTone(paid ? "paid" : "not_paid")}`}>
                      {paid ? "Paid" : "Not paid"}
                    </span>
                  </td>
                  <td className="py-4 pr-4">{attended}/{weekDates.length} days</td>
                  <td className="py-4 pr-4">
                    {average === null ? (
                      <span className="text-gray-400">No marks</span>
                    ) : (
                      <span className={average < 50 ? "font-semibold text-rose-600" : "font-semibold text-navy"}>
                        {average}%
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelect(learner)}
                      className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-gold hover:text-gold"
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AttendanceTracker({ learners, weekDates, attendance, onChange }) {
  return (
    <Card
      title="Attendance"
    >
      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="py-3 pr-4">Learner</th>
              {weekDates.map((date) => (
                <th key={date} className="py-3 pr-3">
                  {shortDateLabel(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {learners.map((learner) => (
              <tr key={learner.id} className="border-b border-gray-100 last:border-0">
                <td className="py-3 pr-4 font-semibold text-navy">{learner.name}</td>
                {weekDates.map((date) => {
                  const value = attendance[attendanceKey(learner.id, date)] || "absent";
                  return (
                    <td key={date} className="py-3 pr-3">
                      <select
                        value={value}
                        onChange={(event) => onChange(learner.id, date, event.target.value)}
                        className={`w-full rounded-md border px-2 py-2 text-xs font-semibold outline-none focus:border-gold ${statusTone(value)}`}
                      >
                        {ATTENDANCE_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function MarksManager({ learners, marks, term, onTermChange, onSaveMark }) {
  const [assessmentName, setAssessmentName] = useState("Test 1");
  const [subject, setSubject] = useState("Mathematics");
  const [assessmentDate, setAssessmentDate] = useState(todayKey());
  const [drafts, setDrafts] = useState({});
  const [savingLearnerId, setSavingLearnerId] = useState(null);
  const averages = learners.map((learner) => ({
    learner,
    average: learnerAverage(learner.id, marks),
  }));

  const assessmentAverages = useMemo(() => {
    const groups = new Map();
    marks.forEach((mark) => {
      const key = `${mark.assessment_name} (${mark.subject})`;
      const current = groups.get(key) || [];
      current.push(Number(mark.percentage || 0));
      groups.set(key, current);
    });

    return Array.from(groups.entries()).map(([label, values]) => ({
      label,
      average: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
    }));
  }, [marks]);

  const updateDraft = (learnerId, key, value) => {
    setDrafts((current) => ({
      ...current,
      [learnerId]: {
        mark: "",
        total: "100",
        ...(current[learnerId] || {}),
        [key]: value,
      },
    }));
  };

  const save = async (learnerId) => {
    const draft = drafts[learnerId] || {};
    setSavingLearnerId(learnerId);
    try {
      await onSaveMark({
        learnerId,
        assessmentName,
        subject,
        assessmentDate,
        mark: draft.mark,
        total: draft.total || 100,
      });
      setDrafts((current) => ({
        ...current,
        [learnerId]: { mark: "", total: draft.total || "100" },
      }));
    } finally {
      setSavingLearnerId(null);
    }
  };

  return (
    <Card
      title="Marks and Performance"
      subtitle="Save marks by term, assessment, and subject. Analytics update after each save."
      action={
        <select
          value={term}
          onChange={(event) => onTermChange(Number(event.target.value))}
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gold"
        >
          {TERMS.map((item) => (
            <option key={item} value={item}>
              Term {item}
            </option>
          ))}
        </select>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Assessment">
          <TextInput value={assessmentName} onChange={(e) => setAssessmentName(e.target.value)} />
        </Field>
        <Field label="Subject">
          <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} />
        </Field>
        <Field label="Assessment date">
          <TextInput type="date" value={assessmentDate} onChange={(e) => setAssessmentDate(e.target.value)} />
        </Field>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="py-3 pr-4">Learner</th>
              <th className="py-3 pr-4">Mark</th>
              <th className="py-3 pr-4">Total</th>
              <th className="py-3 pr-4">Average</th>
              <th className="py-3 text-right">Save</th>
            </tr>
          </thead>
          <tbody>
            {learners.map((learner) => {
              const draft = drafts[learner.id] || { mark: "", total: "100" };
              const average = learnerAverage(learner.id, marks);

              return (
                <tr key={learner.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 pr-4 font-semibold text-navy">{learner.name}</td>
                  <td className="py-3 pr-4">
                    <TextInput
                      type="number"
                      min="0"
                      value={draft.mark}
                      onChange={(e) => updateDraft(learner.id, "mark", e.target.value)}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <TextInput
                      type="number"
                      min="1"
                      value={draft.total}
                      onChange={(e) => updateDraft(learner.id, "total", e.target.value)}
                    />
                  </td>
                  <td className="py-3 pr-4">{average === null ? "No marks" : `${average}%`}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      disabled={!draft.mark || savingLearnerId === learner.id}
                      onClick={() => save(learner.id)}
                      className="rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy/90 disabled:opacity-50"
                    >
                      {savingLearnerId === learner.id ? "Saving" : "Save"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <PerformanceBars rows={averages} />
        <AssessmentComparison rows={assessmentAverages} />
      </div>
    </Card>
  );
}

function PerformanceBars({ rows }) {
  const sortedRows = [...rows]
    .filter((row) => row.average !== null)
    .sort((a, b) => b.average - a.average)
    .slice(0, 8);

  return (
    <div className="rounded-lg border border-gray-100 bg-cream/50 p-4">
      <p className="mb-4 text-sm font-semibold text-navy">Learner performance</p>
      {sortedRows.length === 0 ? (
        <p className="text-sm text-gray-500">No saved marks yet.</p>
      ) : (
        <div className="space-y-3">
          {sortedRows.map(({ learner, average }) => (
            <div key={learner.id}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-navy">{learner.name}</span>
                <span>{average}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className={average < 50 ? "h-full bg-rose-500" : "h-full bg-gold"}
                  style={{ width: `${Math.min(average, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssessmentComparison({ rows }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-cream/50 p-4">
      <p className="mb-4 text-sm font-semibold text-navy">Assessment comparison</p>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No assessments saved for this term.</p>
      ) : (
        <div className="max-h-64 space-y-3 overflow-y-auto pr-2">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="max-w-[70%] truncate font-medium text-navy">{row.label}</span>
                <span>{row.average}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full bg-navy" style={{ width: `${Math.min(row.average, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LearnerModal({ learner, paymentStatus, attendance, weekDates, average, onClose }) {
  const attended = weekDates.filter((date) =>
    ["present", "late"].includes(attendance[attendanceKey(learner.id, date)])
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold">Learner record</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-navy">{learner.name}</h2>
            <p className="mt-1 text-sm text-gray-500">Grade {learner.grade} at {learner.school}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 px-3 py-1.5 text-sm font-semibold text-navy hover:border-gold hover:text-gold"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <MiniStat label="Payment" value={paymentStatus === "paid" ? "Paid" : "Not paid"} />
          <MiniStat label="Attendance" value={`${attended}/${weekDates.length}`} />
          <MiniStat label="Average" value={average === null ? "No marks" : `${average}%`} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Detail label="Parent" value={learner.parent} />
          <Detail label="Phone" value={learner.phone} />
          <Detail label="Strengths" value={learner.strengths} />
          <Detail label="Weaknesses" value={learner.weaknesses} />
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-cream/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-gray-700">{value || "Not specified"}</p>
    </div>
  );
}
