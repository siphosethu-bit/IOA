import { useMemo, useState } from "react";

const initialState = {
  phone: "",
  otp: "",
  generatedOtp: "",
  verified: false,
  learners: [],
  loading: false,
  error: "",
};

function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function readJson(response) {
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error("The portal service returned an unexpected response.");
  }

  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data.error || "Unable to load learner records.");
  }

  return data;
}

function formatStatus(status) {
  if (status === "paid") return "Paid";
  if (status === "not_paid") return "Not paid";
  if (!status) return "Not recorded";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function averageMarks(marks) {
  if (!marks?.length) return null;
  const total = marks.reduce((sum, mark) => sum + Number(mark.percentage || 0), 0);
  return Math.round(total / marks.length);
}

function attendanceSummary(attendance) {
  if (!attendance?.length) {
    return { label: "No attendance recorded", rate: null };
  }

  const attended = attendance.filter((item) =>
    ["present", "late"].includes(item.status)
  ).length;

  return {
    label: `${attended} of ${attendance.length} sessions attended`,
    rate: Math.round((attended / attendance.length) * 100),
  };
}

function PortalInput({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-2 block font-semibold text-navy">{label}</span>
      {children}
    </label>
  );
}

function PortalCard({ title, children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-serif text-lg font-semibold text-navy">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Metric({ label, value, tone = "default" }) {
  const toneClass =
    tone === "gold"
      ? "border-gold/30 bg-gold/10 text-navy"
      : "border-gray-200 bg-cream/70 text-navy";

  return (
    <div className={`rounded-lg border px-4 py-3 ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function LearnerDashboard({ learner }) {
  const average = averageMarks(learner.marks);
  const attendance = attendanceSummary(learner.attendance);
  const latestMarks = [...(learner.marks || [])].slice(0, 4);

  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-navy px-5 py-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Learner profile
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-serif text-2xl font-semibold">
              {learner.name}
            </h3>
            <p className="mt-1 text-sm text-white/75">
              Grade {learner.grade || "Not specified"} at{" "}
              {learner.school || "school not specified"}
            </p>
          </div>
          <span className="rounded-full border border-gold/40 px-3 py-1 text-xs font-semibold text-gold">
            {formatStatus(learner.payment?.status)}
          </span>
        </div>
      </div>

      <div className="space-y-6 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            label="Average"
            value={average === null ? "No marks" : `${average}%`}
            tone="gold"
          />
          <Metric
            label="Attendance"
            value={attendance.rate === null ? "No record" : `${attendance.rate}%`}
          />
          <Metric
            label="Payment"
            value={formatStatus(learner.payment?.status)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <PortalCard title="Academic profile">
            <dl className="space-y-3 text-sm text-gray-700">
              <div>
                <dt className="font-semibold text-navy">Strengths</dt>
                <dd className="mt-1">{learner.strengths || "Not recorded"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-navy">Focus areas</dt>
                <dd className="mt-1">{learner.weaknesses || "Not recorded"}</dd>
              </div>
            </dl>
          </PortalCard>

          <PortalCard title="Attendance summary">
            <p className="text-sm leading-6 text-gray-700">{attendance.label}</p>
            {learner.attendance?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {learner.attendance.slice(0, 8).map((item) => (
                  <span
                    key={`${learner.id}-${item.attendance_date}`}
                    className="rounded-full border border-gray-200 bg-cream px-3 py-1 text-xs text-gray-700"
                  >
                    {item.attendance_date}: {formatStatus(item.status)}
                  </span>
                ))}
              </div>
            ) : null}
          </PortalCard>
        </div>

        <PortalCard title="Latest marks">
          {latestMarks.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-4">Assessment</th>
                    <th className="py-2 pr-4">Subject</th>
                    <th className="py-2 pr-4">Mark</th>
                    <th className="py-2">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {latestMarks.map((mark) => (
                    <tr key={mark.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-navy">
                        {mark.assessment_name}
                      </td>
                      <td className="py-3 pr-4">{mark.subject}</td>
                      <td className="py-3 pr-4">
                        {mark.mark}/{mark.total}
                      </td>
                      <td className="py-3 font-semibold text-navy">
                        {Math.round(Number(mark.percentage || 0))}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Marks will appear here once the tutor has recorded assessments.
            </p>
          )}
        </PortalCard>

        <PortalCard title="Tutor focus">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                This week
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">
                {learner.focus?.focus_topics || "No focus topics recorded yet."}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tutor notes
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">
                {learner.focus?.tutor_notes || "No tutor notes recorded yet."}
              </p>
            </div>
          </div>
        </PortalCard>
      </div>
    </article>
  );
}

export default function ParentPortal() {
  const [state, setState] = useState(initialState);

  const step = useMemo(() => {
    if (state.verified) return "dashboard";
    if (state.generatedOtp) return "otp";
    return "phone";
  }, [state.generatedOtp, state.verified]);

  const requestCode = (event) => {
    event.preventDefault();
    const phone = state.phone.trim();

    if (!phone) {
      setState((current) => ({
        ...current,
        error: "Enter the phone number linked to the learner profile.",
      }));
      return;
    }

    setState((current) => ({
      ...current,
      generatedOtp: generateOtp(),
      otp: "",
      error: "",
      learners: [],
      verified: false,
    }));
  };

  const verifyAndLoad = async (event) => {
    event.preventDefault();

    if (state.otp.trim() !== state.generatedOtp) {
      setState((current) => ({
        ...current,
        error: "The verification code does not match. Please check the code and try again.",
      }));
      return;
    }

    setState((current) => ({ ...current, loading: true, error: "" }));

    try {
      const response = await fetch("/.netlify/functions/get-parent-learners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: state.phone }),
      });
      const data = await readJson(response);

      setState((current) => ({
        ...current,
        verified: true,
        learners: Array.isArray(data.learners) ? data.learners : [],
        loading: false,
        error: "",
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error.message,
      }));
    }
  };

  const reset = () => {
    setState(initialState);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-cream/80 p-4 shadow-xl sm:p-6">
      <div className="overflow-hidden rounded-xl border border-white/80 bg-white shadow-sm">
        <div className="grid gap-8 bg-navy px-6 py-8 text-white lg:grid-cols-[1fr_0.85fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
              Parent access
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold">
              Parent &amp; Learner Progress Portal
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              Enter the parent phone number linked to your learner profile.
              Verification protects learner information and gives you access to
              progress, attendance, payment status, and tutor focus notes.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                <p className="text-sm font-semibold">Secure check</p>
                <p className="mt-1 text-xs leading-5 text-white/65">
                  A short code confirms the person viewing the profile.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                <p className="text-sm font-semibold">Linked learners</p>
                <p className="mt-1 text-xs leading-5 text-white/65">
                  The portal loads learners connected to the parent number.
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/10 p-4">
                <p className="text-sm font-semibold">Progress view</p>
                <p className="mt-1 text-xs leading-5 text-white/65">
                  Review marks, attendance, and current tutor focus.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={step === "phone" ? requestCode : verifyAndLoad}
            className="rounded-lg border border-white/15 bg-white p-5 text-navy shadow-lg"
          >
            {step === "phone" ? (
              <>
                <PortalInput label="Parent WhatsApp or phone number">
                  <input
                    type="tel"
                    value={state.phone}
                    onChange={(event) =>
                      setState((current) => ({
                        ...current,
                        phone: event.target.value,
                        error: "",
                      }))
                    }
                    placeholder="e.g. 067 142 6283"
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/15"
                  />
                </PortalInput>
                <button
                  type="submit"
                  className="mt-5 w-full rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy shadow-sm transition hover:bg-[#b88f20]"
                >
                  Continue
                </button>
              </>
            ) : (
              <>
                <div className="rounded-md border border-gold/30 bg-gold/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Verification code
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-[0.25em] text-navy">
                    {state.generatedOtp}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-gray-600">
                    Temporary verification is active for this session. Enter the
                    code below to view linked learner information.
                  </p>
                </div>

                <div className="mt-5">
                  <PortalInput label="Enter verification code">
                    <input
                      inputMode="numeric"
                      value={state.otp}
                      onChange={(event) =>
                        setState((current) => ({
                          ...current,
                          otp: event.target.value,
                          error: "",
                        }))
                      }
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/15"
                    />
                  </PortalInput>
                </div>

                <button
                  type="submit"
                  disabled={state.loading}
                  className="mt-5 w-full rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy shadow-sm transition hover:bg-[#b88f20] disabled:opacity-60"
                >
                  {state.loading ? "Loading records" : "View learner progress"}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-3 w-full rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:text-gold"
                >
                  Use a different number
                </button>
              </>
            )}

            {state.error && (
              <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {state.error}
              </p>
            )}
          </form>
        </div>

        {state.verified && (
          <div className="space-y-5 bg-cream/60 px-6 py-6 lg:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  Linked learner records
                </p>
                <h3 className="mt-1 font-serif text-2xl font-semibold text-navy">
                  {state.learners.length
                    ? `${state.learners.length} learner profile${state.learners.length === 1 ? "" : "s"} found`
                    : "No linked learner profiles found"}
                </h3>
              </div>
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:border-gold hover:text-gold"
              >
                Sign out
              </button>
            </div>

            {state.learners.length ? (
              <div className="space-y-5">
                {state.learners.map((learner) => (
                  <LearnerDashboard key={learner.id} learner={learner} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm leading-6 text-gray-700">
                No learner profile is linked to this phone number yet. Please
                contact Inevitable Online Academy to confirm the parent number
                on the learner record.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
