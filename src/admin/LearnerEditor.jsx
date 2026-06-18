import { useEffect, useState } from "react";
import {
  getProgressByLearnerId,
  updateProgress,
  addTutorNote,
} from "../firebase/firestore";

export default function LearnerEditor({ learner }) {
  const [progress, setProgress] = useState({
    mathematics: "",
    science: "",
    attendance: "",
  });

  const [note, setNote] = useState("");
  const [recommendation, setRecommendation] = useState("");

  useEffect(() => {
    const loadProgress = async () => {
      const data = await getProgressByLearnerId(learner.id);
      if (data) setProgress(data);
    };

    loadProgress();
  }, [learner.id]);

  const handleSaveProgress = async () => {
    await updateProgress(learner.id, progress);
    alert("Progress saved");
  };

  const handleAddNote = async () => {
    await addTutorNote({
      learnerId: learner.id,
      tutorName: "IOA Tutor",
      note,
      recommendation,
    });

    setNote("");
    setRecommendation("");
    alert("Note added");
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-bold mb-4">
        {learner.name} – Grade {learner.grade}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          className="border p-3 rounded"
          placeholder="Maths %"
          value={progress.mathematics}
          onChange={(e) =>
            setProgress({ ...progress, mathematics: e.target.value })
          }
        />
        <input
          className="border p-3 rounded"
          placeholder="Science %"
          value={progress.science}
          onChange={(e) =>
            setProgress({ ...progress, science: e.target.value })
          }
        />
        <input
          className="border p-3 rounded"
          placeholder="Attendance %"
          value={progress.attendance}
          onChange={(e) =>
            setProgress({ ...progress, attendance: e.target.value })
          }
        />
      </div>

      <button
        onClick={handleSaveProgress}
        className="bg-blue-600 text-white px-6 py-2 rounded mb-6"
      >
        Save Progress
      </button>

      <hr className="my-6" />

      <h3 className="font-semibold mb-2">Tutor Notes</h3>

      <textarea
        className="border w-full p-3 rounded mb-3"
        placeholder="Tutor note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <textarea
        className="border w-full p-3 rounded mb-3"
        placeholder="Recommendations"
        value={recommendation}
        onChange={(e) => setRecommendation(e.target.value)}
      />

      <button
        onClick={handleAddNote}
        className="bg-green-600 text-white px-6 py-2 rounded"
      >
        Add Note
      </button>
    </div>
  );
}
