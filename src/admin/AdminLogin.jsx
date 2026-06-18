import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ADMIN_USERNAME = "Sinethemba";
const ADMIN_PASS = "54321";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");

  // Existing modal (missing details)
  const [showError, setShowError] = useState(false);

  // NEW modal (wrong credentials)
  const [showDenied, setShowDenied] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    // 1) Missing details -> existing modal
    if (!username.trim() || !phone.trim()) {
      setShowError(true);
      setShowDenied(false);
      return;
    }

    // 2) Hard-coded permission check (username + "phone" acting like PIN/password)
    const userOk = username.trim() === ADMIN_USERNAME;
    const passOk = phone.trim() === ADMIN_PASS;

    if (!userOk || !passOk) {
      setShowDenied(true);
      setShowError(false);
      return;
    }

    navigate("/admin/dashboard");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* BACKGROUND VIDEO */}
      <video
        className="fixed inset-0 w-full h-full object-cover -z-20 brightness-75"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/videos/AdminBackgroundVid.mp4" type="video/mp4" />
      </video>

      {/* LOGIN CARD */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white/90 p-6 shadow-2xl">
        <h2 className="text-center text-2xl font-semibold text-navy mb-6">
          Admin Login
        </h2>

        <form className="space-y-4" onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold outline-none"
          />

          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gold outline-none"
          />

          <button
            type="submit"
            className="w-full rounded-md bg-gold py-2 font-semibold text-navy hover:bg-[#b88f20] transition"
          >
            Login
          </button>
        </form>

        <button
          onClick={() => navigate("/")}
          className="mt-4 block w-full text-center text-xs text-gray-500 hover:underline"
        >
          ← Back to website
        </button>
      </div>

      {/* GLASS ERROR MODAL (Missing details) */}
      {showError && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowError(false)}
          />

          {/* Modal */}
          <div className="relative z-40 w-full max-w-sm rounded-2xl border border-white/20 bg-white/20 p-6 shadow-2xl backdrop-blur-xl">
            {/* Close button */}
            <button
              onClick={() => setShowError(false)}
              className="absolute top-3 right-3 text-white/80 hover:text-white text-sm"
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold text-white mb-2 text-center">
              Missing details
            </h3>

            <p className="text-sm text-white/90 text-center">
              Please enter both your username and phone number to continue.
            </p>

            <button
              onClick={() => setShowError(false)}
              className="mt-4 w-full rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-[#b88f20] transition"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/*GLASS ERROR MODAL (Wrong credentials) */}
      {showDenied && (
        <div className="fixed inset-0 z-30 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDenied(false)}
          />

          {/* Modal */}
          <div className="relative z-40 w-full max-w-sm rounded-2xl border border-white/20 bg-white/20 p-6 shadow-2xl backdrop-blur-xl">
            {/* Close button */}
            <button
              onClick={() => setShowDenied(false)}
              className="absolute top-3 right-3 text-white/80 hover:text-white text-sm"
            >
              ✕
            </button>

            <h3 className="text-lg font-semibold text-white mb-2 text-center">
              Access denied
            </h3>

            <p className="text-sm text-white/90 text-center">
              Incorrect username or passcode. Please try again.
            </p>

            <button
              onClick={() => setShowDenied(false)}
              className="mt-4 w-full rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy hover:bg-[#b88f20] transition"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
