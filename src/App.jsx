import { useState } from "react";
import ParentPortal from "./ParentPortal";

const ADMIN_WHATSAPP = "27671426283";

const packages = [
  {
    id: "highschool",
    name: "Grade 8–12 STEM Tutoring",
    description: "Online Maths & Science sessions aligned with the CAPS curriculum.",
  },
  {
    id: "nbt",
    name: "NBT Prep Package",
    description: "Focused NBT Mathematics & Academic Literacy preparation.",
  },
  {
    id: "uni-apps",
    name: "University Applications Support",
    description: "Help with online applications, personal statements & documentation.",
  },
  {
    id: "k53",
    name: "K53 Tutoring",
    description: "Theory support for learners preparing for the K53 test.",
  },
];

const subjectsOffered = [
  "Mathematics",
  "Physical Sciences",
  "Life Sciences",
  "Natural Sciences",
  "Technology",
];

export default function App() {
  const [selectedPackage, setSelectedPackage] = useState(packages[0]);
  const [bookingStatus, setBookingStatus] = useState("idle");

  return (
    <div className="min-h-screen text-navy font-sans">


      {/* NAVBAR */}
      <Navbar />
      {/* HERO SECTION */}
      <Hero />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-20">

        {/* SERVICES */}
        <Services />

        {/* SUBJECTS */}
        <SubjectsSection />

        {/* PACKAGES */}
        <section id="packages" className="space-y-8">
          <h2 className="font-serif text-3xl font-semibold text-navy">Packages & Booking</h2>

          <PackageSelector
            packages={packages}
            selectedPackage={selectedPackage}
            onSelect={setSelectedPackage}
          />

          <StatusBar status={bookingStatus} />

          <BookingForm
            selectedPackage={selectedPackage}
            onSubmitted={() => setBookingStatus("pending")}
          />
        </section>

        {/* LEARNER PROGRESS */}
        <LearnerProgress />

        {/* CONTACT SECTION */}
        <Contact />

        {/* PARENT PORTAL */}
        <ParentPortal />
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

/* -------------------------------- NAVBAR -------------------------------- */

function Navbar() {
  return (
    <header className="bg-navy text-white py-4 sticky top-0 z-20 shadow-md">
      <nav className="max-w-6xl mx-auto px-6 flex items-center justify-between">

        {/* LOGO + NAME */}
        <div className="flex items-center gap-3">
          <img
            src="/logo2.png"
            alt="Inevitable Online Academy Logo"
            className="h-7 w-auto object-contain"
          />
          <span className="font-semibold tracking-wide text-white text-sm sm:text-base">
            Inevitable Online Academy
          </span>
        </div>

        {/* NAV LINKS */}
        <div className="hidden sm:flex gap-6 text-sm font-medium">
          <NavItem href="#services">Services</NavItem>
          <NavItem href="#packages">Packages</NavItem>
          <NavItem href="#parent-portal">Parent Portal</NavItem>
          <NavItem href="#progress">Learner Progress</NavItem>
          <NavItem href="#contact">Contact</NavItem>
        </div>

      </nav>
    </header>
  );
}


function NavItem({ href, children }) {
  return (
    <a
      href={href}
      className="text-white hover:text-gold transition font-medium"
    >
      {children}
    </a>
  );
}

/* -------------------------------- HERO -------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[650px] w-full">

      {/* BACKGROUND VIDEO LAYER */}
      <div className="absolute inset-0 -z-10 pointer-events-none w-full">
        
          <video
            className="absolute inset-0 w-full h-full object-cover object-center brightness-75"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="/background.mp4" type="video/mp4" />
          </video>

          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-white/40"></div>
      </div>

      {/* FOREGROUND CONTENT */}
      <div className="w-full px-6 py-20 mx-auto">

        <div className="grid md:grid-cols-2 gap-10 items-center">

          {/* LEFT CONTENT */}
          <div>
            <p className="tracking-widest text-xs text-white mb-3 drop-shadow-lg">
              GAUTENG • ONLINE • STEM FOCUSED
            </p>

            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white leading-snug mb-6 drop-shadow-xl">
              Online STEM tutoring from Grade 8–12,
              NBT prep & university readiness.
            </h1>

            <p className="text-white/90 text-lg max-w-xl mb-6 drop-shadow-lg">
              Inevitable Online Academy helps learners build strong foundations
              in Mathematics & Science, excel in NBTs, and confidently apply to
              universities across South Africa.
            </p>

            <div className="flex gap-4">
              <a
                href="#packages"
                className="px-5 py-2 bg-gold text-navy font-semibold rounded-md shadow hover:bg-[#b88f20] transition"
              >
                Book a session
              </a>

              <a
                href="#contact"
                className="px-5 py-2 border border-white text-white font-semibold rounded-md hover:bg-white hover:text-navy transition"
              >
                Talk to us
              </a>
            </div>
          </div>

            {/* RIGHT LOGO + VERTICAL LINE */}
            <div className="hidden md:flex items-center justify-center">
              {/* Vertical line */}
              <div className="w-px h-60 bg-black/40 mr-10"></div>

              {/* Logo WITH SPIN ANIMATION */}
              <img
                src="/logo.png"
                alt="Inevitable Online Academy Logo"
                className="h-60 w-auto opacity-95 drop-shadow-lg animate-coin-spin"
              />
            </div>
        </div>
      </div>
    </section>
  );
}


/* ------------------------------- SERVICES ------------------------------- */

function Services() {
  return (
    <section id="services" className="space-y-10">
      <h2 className="font-serif text-3xl font-semibold">What we offer</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <ServiceCard title="Grade 8–12 STEM Tutoring"
          text="Weekly online classes, exam preparation and homework support in Mathematics & Science."
        />
        <ServiceCard title="NBT Services & Resources"
          text="Targeted practice, past papers and crash courses for NBT Mathematics and Academic Literacy."
        />
        <ServiceCard title="University Application Support"
          text="Assistance with applications, motivation letters and programme selection."
        />
        <ServiceCard title="K53 Tutoring"
          text="Guided lessons on K53 rules and theory to help learners prepare confidently for the test."
        />
      </div>

      <MissionVision />
    </section>
  );
}

function ServiceCard({ title, text }) {
  return (
    <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition">
      <h3 className="font-serif text-lg font-semibold text-navy mb-2">{title}</h3>
      <p className="text-gray-700 text-sm">{text}</p>
    </div>
  );
}

function MissionVision() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <MVCard title="Our Mission"
        text="To make high-quality STEM tutoring, NBT preparation, university support and K53 guidance accessible to every learner in South Africa."
      />
      <MVCard title="Our Vision"
        text="To become the leading online academy offering trusted academic support from Grade 8 to university building confident, future-ready learners."
      />
    </div>
  );
}

function MVCard({ title, text }) {
  return (
    <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl">
      <h3 className="font-serif text-lg font-semibold text-navy mb-2">{title}</h3>
      <p className="text-gray-700 text-sm">{text}</p>
    </div>
  );
}

/* ----------------------------- SUBJECTS ----------------------------- */

function SubjectsSection() {
  return (
    <section className="space-y-4">
      <h2 className="font-serif text-3xl font-semibold">STEM subjects we focus on</h2>
      <p className="text-gray-600">We currently support Grade 8–12 learners in:</p>

      <div className="flex flex-wrap gap-3">
        {subjectsOffered.map((s) => (
          <span
            key={s}
            className="px-4 py-1 border border-gold text-gold rounded-full text-sm font-medium"
          >
            {s}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- PACKAGE SELECTOR ---------------------------- */

function PackageSelector({ packages, selectedPackage, onSelect }) {
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {packages.map((pkg) => {
        const active = pkg.id === selectedPackage.id;
        return (
          <button
            key={pkg.id}
            onClick={() => onSelect(pkg)}
            className={`text-left p-5 rounded-xl border shadow-sm transition
              ${
                active
                  ? "bg-gold text-navy border-gold"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
          >
            <div className="font-serif text-lg font-semibold">{pkg.name}</div>
            <p className="text-gray-700 text-sm mt-1">{pkg.description}</p>
            {active && <p className="text-xs font-medium mt-2">Selected package</p>}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------ STATUS BAR ------------------------------ */

function StatusBar({ status }) {
  let text = "No booking yet";
  let style = "bg-gray-50 border-gray-200 text-gray-600";

  if (status === "pending") {
    text = "Booking sent — pending review";
    style = "bg-gray-100 border-gray-300 text-navy";
  }

  return (
    <div className={`p-4 rounded-xl border ${style} text-sm`}>
      {text}
      <p className="text-xs text-gray-500 mt-1">
        (In a full system, status updates would sync from the admin dashboard.)
      </p>
    </div>
  );
}

/* ----------------------------- BOOKING FORM ----------------------------- */

function BookingForm({ selectedPackage, onSubmitted }) {
  const [form, setForm] = useState({
    isParent: "parent",
    learnerName: "",
    parentName: "",
    grade: "",
    subjects: "",
    preferredTimes: "",
    contactWhatsapp: "",
    email: "",
    notes: "",
  });

  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = (e) => {
    e.preventDefault();

    const msg = `
New booking request – Inevitable Online Academy

Learner: ${form.learnerName}
Parent: ${form.parentName || "N/A"}
Grade: ${form.grade}
Package: ${selectedPackage.name}
Subjects: ${form.subjects}
Preferred times: ${form.preferredTimes}

Contact:
WhatsApp: ${form.contactWhatsapp}
Email: ${form.email}

Notes:
${form.notes}
    `.trim();

    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(msg)}`);
    onSubmitted();
  };

  return (
    <form
      onSubmit={submit}
      className="p-6 bg-gray-50 border border-gray-200 rounded-xl space-y-6"
    >
      <h3 className="font-serif text-xl font-semibold">
        Book: {selectedPackage.name}
      </h3>

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="isParent"
            value="parent"
            checked={form.isParent === "parent"}
            onChange={update}
          />
          Parent / Guardian
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="isParent"
            value="learner"
            checked={form.isParent === "learner"}
            onChange={update}
          />
          Learner
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Input label="Learner full name" name="learnerName" value={form.learnerName} onChange={update} required />
        <Input label="Parent / Guardian name" name="parentName" value={form.parentName} onChange={update} />
        <Input label="Grade" name="grade" value={form.grade} onChange={update} required />
        <Input label="WhatsApp number" name="contactWhatsapp" value={form.contactWhatsapp} onChange={update} required />
        <Input label="Email address" name="email" value={form.email} onChange={update} />
        <Input label="Subjects / focus areas" name="subjects" value={form.subjects} onChange={update} />
      </div>

      <Textarea label="Preferred days & times" name="preferredTimes" value={form.preferredTimes} onChange={update} />
      <Textarea label="Additional notes" name="notes" value={form.notes} onChange={update} />

      <button
        type="submit"
        className="px-5 py-2 bg-gold text-navy font-semibold rounded-md shadow hover:bg-[#b88f20] transition"
      >
        Send booking via WhatsApp
      </button>
    </form>
  );
}

function Input({ label, ...props }) {
  return (
    <label className="text-sm">
      <span className="block text-navy font-medium mb-1">{label}</span>
      <input
        {...props}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:border-gold outline-none"
      />
    </label>
  );
}

function Textarea({ label, ...props }) {
  return (
    <label className="text-sm">
      <span className="block text-navy font-medium mb-1">{label}</span>
      <textarea
        {...props}
        rows={3}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:border-gold outline-none"
      />
    </label>
  );
}

/* -------------------------- LEARNER PROGRESS -------------------------- */

function LearnerProgress() {
  const progress = [
    { subject: "Mathematics", percent: 65 },
    { subject: "Physical Sciences", percent: 40 },
    { subject: "Life Sciences", percent: 55 },
  ];

  return (
    <section id="progress" className="space-y-6">
      <h2 className="font-serif text-3xl font-semibold">Learner progress</h2>

      <p className="text-gray-600 max-w-xl">
        Parents and learners can monitor improvement across different subjects through
        tracked progress scores.
      </p>

      <div className="space-y-4">
        {progress.map((p) => (
          <div key={p.subject}>
            <div className="flex justify-between text-sm text-navy mb-1">
              <span>{p.subject}</span>
              <span>{p.percent}%</span>
            </div>
            <div className="h-2 bg-gray-300 rounded-full">
              <div
                className="h-2 bg-gold rounded-full"
                style={{ width: `${p.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- CONTACT ------------------------------- */

function Contact() {
  return (
    <section id="contact" className="space-y-4">
      <h2 className="font-serif text-3xl font-semibold">Contact & location</h2>

      <p className="text-gray-700 text-sm">
        Based in Johannesburg, Gauteng available online across all provinces.
      </p>

      <p className="text-sm">
        Email:{" "}
        <a
          href="mailto:inevitableonlineacademy@gmail.com"
          className="text-gold font-medium underline hover:text-[#b88f20]"
        >
          inevitableonlineacademy@gmail.com
        </a>
      </p>

      <button
        onClick={() =>
          window.open(
            "https://wa.me/27671426283?text=" +
              encodeURIComponent("Hello IOA, I would like to ask about..."),
            "_blank"
          )
        }
        className="px-5 py-2 bg-gold text-navy font-semibold rounded-md shadow hover:bg-[#b88f20] transition"
      >
        Chat with us on WhatsApp
      </button>
    </section>
  );
}

/* -------------------------------- FOOTER -------------------------------- */

function Footer() {
  return (
    <footer className="mt-20 py-6 border-t border-gray-200 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 text-xs text-gray-600 flex justify-between">
        <span>© {new Date().getFullYear()} Inevitable Online Academy</span>
        <span>Built with ❤️ in South Africa</span>
      </div>
    </footer>
  );
}
