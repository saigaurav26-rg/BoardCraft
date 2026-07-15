import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function WhiteboardPage() {
  const { id } = useParams(); 
  const [elements, setElements] = useState({});
  const [saveStatus, setSaveStatus] = useState("Saved locally");

  // Local state change indicator simulation
  useEffect(() => {
    if (Object.keys(elements).length === 0) return;

    setSaveStatus("Saving changes...");
    const timeout = setTimeout(() => {
      setSaveStatus("Saved to session cache");
    }, 1000);

    return () => clearTimeout(timeout);
  }, [elements]);

  return (
    <div className="w-full h-screen bg-white dark:bg-slate-950 flex flex-col">
      {/* Top Controller Ribbon */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            ← Back to Dashboard
          </Link>
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
            ID: {id}
          </span>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          ● {saveStatus}
        </div>
      </div>

      {/* Editor Space Workspace */}
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
        <p className="text-sm">Whiteboard Editor Active</p>
        <button 
          onClick={() => setElements({ changed: Date.now() })}
          className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white"
        >
          Simulate Canvas Update Action
        </button>
      </div>
    </div>
  );
}