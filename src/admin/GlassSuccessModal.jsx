import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function GlassSuccessModal({ open, onClose, learner }) {
  useEffect(() => {
    if (open) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl p-8 w-[90%] max-w-md border border-white/40">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-black text-lg"
        >
          ✕
        </button>

        <h2 className="font-serif text-2xl text-navy font-semibold text-center">
          Learner Created 🎉
        </h2>

        <p className="text-center text-gray-700 mt-3">
          <strong>{learner.name}</strong> (Grade {learner.grade}) has been
          successfully added.
        </p>
      </div>
    </div>
  );
}
