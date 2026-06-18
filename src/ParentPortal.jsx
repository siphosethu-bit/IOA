import { useState } from "react";

const mockDashboard = {
  learnerName: "Khumo M.",
  grade: "Grade 11",
  weekSummary:
    "Khumo improved on Algebra and Functions this week, but still needs practice on Trigonometry. Homework consistency is strong.",
  topics: [
    { subject: "Mathematics", topic: "Algebra & Functions", mastery: 72 },
    { subject: "Mathematics", topic: "Trigonometry", mastery: 48 },
    { subject: "Physical Sciences", topic: "Mechanics", mastery: 60 },
    { subject: "Life Sciences", topic: "Cells & Systems", mastery: 81 },
  ],
  homework: {
    completedThisWeek: 5,
    missedThisWeek: 1,
    streakDays: 7,
  },
  upcomingTasks: [
    {
      date: "Sat, 30 Nov",
      title: "NBT Maths practice session",
      detail: "Algebra, data handling & probability – 60 min Zoom session.",
    },
    {
      date: "Wed, 4 Dec",
      title: "Physical Sciences quiz",
      detail: "Short quiz on forces & Newton’s laws.",
    },
  ],
  tutorNotes: [
    {
      date: "This week",
      note: "Great focus in lessons. Struggles a bit when questions are wordy – we are practising unpacking NBT-style questions.",
    },
    {
      date: "Last week",
      note: "Homework submitted on time. Confident with basic algebra; we’ve moved to exam-type questions.",
    },
  ],
};

function ProgressBar({ value }) {
  return (
    <div className="mt-2">
      <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
        <div className="h-full bg-white" style={{ width: `${value}%` }} />
      </div>
      <div className="mt-1 text-xs text-white/80">{value}%</div>
    </div>
  );
}

function DashboardCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 shadow-md">
      <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

export default function ParentPortal() {
  const [step, setStep] = useState("phone"); // "phone" | "otp" | "dashboard"
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const handleRequestOtp = (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setStep("otp");
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    // For now we accept any OTP – this is just a front-end prototype.
    if (!otp.trim()) return;
    setStep("dashboard");
  };

  return (
    <section
      id="parent-portal"
      className="relative z-10 mx-auto mt-16 max-w-6xl rounded-3xl border border-white/10 bg-black/70 px-6 py-10 text-white shadow-2xl backdrop-blur-2xl md:px-10 md:py-12"
    >
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold md:text-3xl">
            Parent &amp; Learner Progress Portal
          </h2>
          <p className="mt-2 text-sm text-white/80 md:text-base">
            Log in with your phone number to see live progress, homework status
            and tutor notes all in one place.
          </p>
        </div>
        <div className="mt-4 rounded-full border border-emerald-300/40 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-100 md:mt-0">
          Comming soon: full live integration with WhatsApp OTP login
        </div>
      </div>

      {step !== "dashboard" ? (
        <div className="grid gap-8 md:grid-cols-2">
          {/* LEFT: explanation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Quick login</h3>
            <p className="text-sm text-white/80">
              In the final version, parents will receive a one-time PIN (OTP) on
              WhatsApp or SMS. For now, this demo simply lets you move through
              the flow without sending a real OTP.
            </p>

            <ul className="mt-2 space-y-2 text-sm text-white/80">
              <li>• Secure login with your mobile number</li>
              <li>• One parent can see all linked learners</li>
              <li>• Perfect for busy parents who can’t attend every session</li>
            </ul>
          </div>

          {/* RIGHT: phone / OTP form */}
          <form className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-md">
            {step === "phone" && (
              <>
                <label className="block text-sm font-medium text-white">
                  Parent WhatsApp number
                  <input
                    type="tel"
                    placeholder="e.g. 067 142 6283"
                    className="mt-2 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
                <button
                  onClick={handleRequestOtp}
                  className="mt-4 w-full rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-100"
                >
                  Send OTP
                </button>
                <p className="mt-2 text-xs text-white/60">
                  In the real system we’ll send a 4-digit OTP to your WhatsApp
                  Business number. Here it just moves you to the next step.
                </p>
              </>
            )}

            {step === "otp" && (
              <>
                <label className="block text-sm font-medium text-white">
                  Enter OTP
                  <input
                    type="text"
                    placeholder="e.g. 1234"
                    className="mt-2 w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </label>
                <button
                  onClick={handleVerifyOtp}
                  className="mt-4 w-full rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-slate-100"
                >
                  View demo dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                  }}
                  className="mt-2 w-full rounded-full border border-white/30 bg-transparent px-4 py-2 text-xs font-medium text-white hover:bg-white/10"
                >
                  ⟵ Change phone number
                </button>
              </>
            )}
          </form>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* HEADER */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                Live learner snapshot
              </p>
              <h3 className="text-xl font-semibold">
                {mockDashboard.learnerName} • {mockDashboard.grade}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
              }}
              className="mt-3 rounded-full border border-white/30 px-4 py-2 text-xs font-medium text-white hover:bg-white/10 md:mt-0"
            >
              Switch learner / log out
            </button>
          </div>

          {/* TOP ROW CARDS */}
          <div className="grid gap-6 md:grid-cols-3">
            <DashboardCard title="This week at a glance">
              <p className="text-sm text-white/80">
                {mockDashboard.weekSummary}
              </p>
            </DashboardCard>

            <DashboardCard title="Homework & consistency">
              <dl className="space-y-2 text-sm text-white/80">
                <div className="flex justify-between">
                  <dt>Homework done this week</dt>
                  <dd className="font-semibold">
                    {mockDashboard.homework.completedThisWeek}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Homework missed</dt>
                  <dd className="font-semibold text-amber-200">
                    {mockDashboard.homework.missedThisWeek}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Work streak</dt>
                  <dd className="font-semibold">
                    {mockDashboard.homework.streakDays} days
                  </dd>
                </div>
              </dl>
            </DashboardCard>

            <DashboardCard title="Upcoming NBT & test prep">
              <ul className="space-y-2 text-sm text-white/80">
                {mockDashboard.upcomingTasks.map((task) => (
                  <li key={task.title}>
                    <p className="text-xs uppercase tracking-wide text-white/60">
                      {task.date}
                    </p>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-xs text-white/70">{task.detail}</p>
                  </li>
                ))}
              </ul>
            </DashboardCard>
          </div>

          {/* BOTTOM ROW CARDS */}
          <div className="grid gap-6 md:grid-cols-2">
            <DashboardCard title="Topic mastery (per subject)">
              <div className="space-y-3">
                {mockDashboard.topics.map((item) => (
                  <div key={item.subject + item.topic}>
                    <div className="flex justify-between text-xs text-white/70">
                      <span>
                        <span className="font-semibold text-white">
                          {item.subject}
                        </span>{" "}
                        – {item.topic}
                      </span>
                      <span className="font-semibold">
                        {item.mastery}%
                      </span>
                    </div>
                    <ProgressBar value={item.mastery} />
                  </div>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard title="Tutor notes for parents">
              <ul className="space-y-3 text-sm text-white/80">
                {mockDashboard.tutorNotes.map((note) => (
                  <li key={note.date}>
                    <p className="text-xs uppercase tracking-wide text-white/60">
                      {note.date}
                    </p>
                    <p>{note.note}</p>
                  </li>
                ))}
              </ul>
            </DashboardCard>
          </div>
        </div>
      )}
    </section>
  );
}
