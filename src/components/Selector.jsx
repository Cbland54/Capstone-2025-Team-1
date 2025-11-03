import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

/*******************************
 * Selector.jsx 
 * - Supabase-backed questions/options/categories/sizes
 * - LocalStorage snapshots for scheduler handoff
 *******************************/

/* === Simple YouTube player === */
function YouTubePlayer({ videoId }) {
  if (!videoId) return null;
  const url = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
  return (
    <div className="w-full overflow-hidden rounded-[var(--radius)] bg-grey">
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={url}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay"
          allowFullScreen
        />
      </div>
    </div>
  );
}

function ChoiceButton({ label, onClick, selected }) {
  const base =
    "w-full text-center border px-4 py-3 text-base rounded-[var(--radius)] transition";
  return (
    <button
      onClick={onClick}
      className={
        selected
          ? `${base} border-primary bg-primaryOpaque shadow-[var(--shadow)]`
          : `${base} border-border bg-white hover:border-primary hover:shadow-[var(--shadow)]`
      }
    >
      <span className="font-medium text-almostblack">{label}</span>
    </button>
  );
}

function GridButton({ label, onClick, selected }) {
  const base =
    "w-full text-center break-words border px-3 py-2 text-base rounded-[var(--radius)] transition";
  return (
    <button
      onClick={onClick}
      className={
        selected
          ? `${base} border-primary bg-primaryOpaque shadow-[var(--shadow)]`
          : `${base} border-border bg-white hover:border-primary hover:shadow-[var(--shadow)]`
      }
    >
      <span className="text-almostblack font-medium">{label}</span>
    </button>
  );
}

function StepHeader({ idx, total }) {
  const safeTotal = Math.max(total, idx + 1);
  return (
    <div className="text-center">
      <div className="text-[13px] text-almostblack/70 mb-1 font-medium">
        Step {idx + 1} of {safeTotal}
      </div>
      <div className="flex justify-center gap-1">
        {Array.from({ length: safeTotal }).map((_, i) => (
          <span
            key={i}
            className={
              i <= idx
                ? "h-1.5 w-4 rounded-[9999px] bg-primary"
                : "h-1.5 w-4 rounded-[9999px] bg-[var(--color-grey)]"
            }
          />
        ))}
      </div>
    </div>
  );
}

/* === Simple video maps (update IDs as needed) === */
const SLIDE_VIDEOS = {
  welcome: "m7AqWCzoi6I",
  start: "m7AqWCzoi6I",
  feel: "m7AqWCzoi6I",
  gait: "m7AqWCzoi6I",
  trail_experience: "m7AqWCzoi6I",
  mixed_goal: "m7AqWCzoi6I",
  size_women: "m7AqWCzoi6I",
  size_men: "m7AqWCzoi6I",
  price: "m7AqWCzoi6I",
  contact: "m7AqWCzoi6I",
};

const RESULT_VIDEOS = {
  neutral: "m7AqWCzoi6I",
  stability: "m7AqWCzoi6I",
  trail: "m7AqWCzoi6I",
  speed: "m7AqWCzoi6I",
  walking: "m7AqWCzoi6I",
};

/* ========================= Component ========================= */
export default function ShoeSelector() {
  const navigate = useNavigate();

  // Quiz data from Supabase
  const [questions, setQuestions] = useState([]); // { id, text, render, cols }
  const [options, setOptions] = useState([]); // { question_id, label, value, next }
  const [categories, setCategories] = useState([]); // { id, title, blurb, img }
  const [sizes, setSizes] = useState([]); // { gender, size }

  const [hydrated, setHydrated] = useState(false);


  // User state
  const [answers, setAnswers] = useState({});
  const [path, setPath] = useState(["welcome"]);
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  const STORAGE_KEY = "fw_selector_state";

  // Save selector state + a scheduler-friendly contact object
function saveSnapshot(
  nextPath = path,
  nextAnswers = answers,
  nextContact = contact
) {
  try {
    // Full state (resume support)
    localStorage.setItem(
      "fw_selector_state",
      JSON.stringify({
        path: nextPath,
        answers: nextAnswers,
        contact: nextContact,
      })
    );

    // What SmartScheduler reads on mount
    localStorage.setItem(
      "fw_contact",
      JSON.stringify({
        first_name: nextContact.firstName || "",
        last_name: nextContact.lastName || "",
        email: nextContact.email || "",
        phone_number: nextContact.phone || "",
        notes: nextContact.notes || "",
      })
    );
  } catch {}
}


  // Load data + resume snapshot
useEffect(() => {
  // 1) Restore synchronously so UI jumps to saved step immediately
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (Array.isArray(saved.path)) setPath(saved.path);
      if (saved.answers) setAnswers(saved.answers);
      if (saved.contact) setContact(saved.contact);
    }
  } catch {}
  try {
    const rawC = localStorage.getItem("fw_contact");
    if (rawC) {
      const c = JSON.parse(rawC);
      setContact((prev) => ({
        ...prev,
        firstName: c.first_name ?? prev.firstName ?? "",
        lastName:  c.last_name  ?? prev.lastName  ?? "",
        email:     c.email      ?? prev.email     ?? "",
        phone:     c.phone ?? c.phone_number ?? prev.phone ?? "",
        // keep notes from selector, scheduler doesn't write notes
      }));
    }
  } catch {}

  setHydrated(true);

  // 2) Then fetch Supabase data (async)
  async function fetchAll() {
    const { data: qData } = await supabase.from("questions").select();
    const { data: oData } = await supabase.from("question_options").select();
    const { data: cData } = await supabase.from("categories").select();
    const { data: sData } = await supabase.from("shoe_sizes").select();

    setQuestions(qData || []);
    setOptions(oData || []);
    setCategories(cData || []);

    const sorted = (sData || [])
      .slice()
      .sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    setSizes(sorted);
  }
  fetchAll();
}, []);


useEffect(() => {
  if (!hydrated) return;
  saveSnapshot(path, answers, contact);
}, [contact, hydrated]); // keep it simple: save as user types contact


useEffect(() => {
  return () => {
    if (hydrated) {
      saveSnapshot(path, answers, contact);
    }
  };
}, [hydrated, path, answers, contact]);

useEffect(() => {
  function handlePageShow() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.path)) setPath(saved.path);
        if (saved.answers) setAnswers(saved.answers);
        if (saved.contact) setContact(saved.contact);
      }
    } catch {}

    try {
      const rawC = localStorage.getItem("fw_contact");
      if (rawC) {
        const c = JSON.parse(rawC);
        setContact(prev => ({
          ...prev,
          firstName: c.first_name ?? prev.firstName ?? "",
          lastName:  c.last_name  ?? prev.lastName  ?? "",
          email:     c.email      ?? prev.email     ?? "",
          phone:     c.phone ?? c.phone_number ?? prev.phone ?? "",
        }));
      }
    } catch {}
  }
  window.addEventListener("pageshow", handlePageShow);
  return () => window.removeEventListener("pageshow", handlePageShow);
}, []);

  



  const currentId = path[path.length - 1];

  // Get choices: use shoe_sizes for size screens, otherwise question_options
  function getOptionsFor(questionId) {
    if (questionId === "size_women") {
      return sizes
        .filter((s) => s.gender === "women")
        .map((s) => ({ label: s.size, value: s.size, next: "price" }));
    }
    if (questionId === "size_men") {
      return sizes
        .filter((s) => s.gender === "men")
        .map((s) => ({ label: s.size, value: s.size, next: "price" }));
    }
    return options.filter((o) => o.question_id === questionId);
  }

  // Determine category (kept simple and readable)
  function pickCategory(a) {
    if (a.start === "walking") return "walking";
    if (a.start === "trail") {
      if (a.trail_experience === "mixed")
        return a.mixed_goal === "fast" ? "speed" : "trail";
      return "trail";
    }
    if (a.gait === "support_yes") return "stability";
    if (a.feel === "snappy") return "speed";
    return "neutral";
  }


  function onChoose(opt) {
    if (!opt) return;
    const qid = currentId;
    const nextId = opt.next;
    const newAnswers = { ...answers, [qid]: opt.value };
    setAnswers(newAnswers);

    if (nextId) {
      const newPath = [...path, nextId];
      setPath(newPath);
      saveSnapshot(newPath, newAnswers, contact);
    } else {
      // keep snapshot fresh even without an explicit next
      saveSnapshot(path, newAnswers, contact);
    }
  }

  function goBack() {
    if (path.length <= 1) return;
    const newPath = path.slice(0, -1);
    setPath(newPath);
    saveSnapshot(newPath, answers, contact);
  }

  function handleScheduleClick() {
    const categoryKey = pickCategory(answers);
    const cat =
      categories.find((c) => c.id === categoryKey) || {
        id: categoryKey,
        title: categoryKey,
      };
    localStorage.setItem(
      "fw_recommended",
      JSON.stringify({
        key: categoryKey,
        title: cat.title,
        blurb: cat.blurb || "",
        img: cat.img || "",
      })
    );
    saveSnapshot(path, answers, contact);
    navigate("/scheduler");
  }

  function restart() {
    setPath(["welcome"]);
    setAnswers({});
    setContact({ firstName: "", lastName: "", email: "", phone: "", notes: "" });
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("fw_contact");
      localStorage.removeItem("fw_recommended");
    } catch {}
  }

  // ================= UI =================
  const categoryKey = pickCategory(answers);
  const cat =
    categories.find((c) => c.id === categoryKey) || {
      id: categoryKey,
      title: categoryKey,
    };
  const currentQuestion = questions.find((q) => q.id === currentId);
  const stepIndex = Math.max(0, path.length - 2);

  // Result screen (early return)
  if (currentId === "showResult") {
    return (
      <div className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white border border-border rounded-[var(--radius)] shadow-[var(--shadow)] p-5 text-almostblack text-lg">
        <div className="p-4 bg-white text-center">
          {RESULT_VIDEOS[categoryKey] && (
            <div className="mb-3">
              <YouTubePlayer videoId={RESULT_VIDEOS[categoryKey]} />
            </div>
          )}

          {cat.img && (
            <img
              src={cat.img}
              alt={cat.title}
              className="w-full h-auto max-h-72 object-contain rounded-[var(--radius)] border border-border"
            />
          )}

          <h3 className="mt-3 text-xl font-semibold text-primary">
            Recommended: {cat.title}
          </h3>
          {cat.blurb && (
            <p className="mt-2 text-base text-almostblack/80 max-w-prose mx-auto">
              {cat.blurb}
            </p>
          )}

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={restart}
              className="border border-border bg-white text-sm px-4 py-2 rounded-[var(--radius)] hover:border-primary hover:shadow-[var(--shadow)] transition"
            >
              Start Over
            </button>
            <button
              onClick={handleScheduleClick}
              className="border border-primary bg-primary text-white px-4 py-2 text-sm rounded-[var(--radius)] shadow-[var(--shadow)] hover:bg-[var(--color-brand-600)] transition"
            >
              Schedule a Fitting
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Guard if we don't find a question id
  if (!currentQuestion) {
    return (
      <div className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl border border-red-300 bg-red-50 rounded-[var(--radius)] shadow-[var(--shadow)] p-5">
        <p className="text-sm text-red-700">Question not found.</p>
      </div>
    );
  }

  const isForm = currentQuestion.render === "form";
  const isGrid = currentQuestion.render === "grid";
  const opts = getOptionsFor(currentQuestion.id);

  // Main quiz view
  return (
    <div className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white border border-border rounded-[var(--radius)] shadow-[var(--shadow)] p-5 text-almostblack text-lg">
      <div className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-[35%_65%] gap-4 items-start">
          {/* Left side controls */}
          <div>
            {currentId !== "welcome" && <StepHeader idx={stepIndex} total={6} />}

            <div className="mt-10 text-lg font-semibold">{currentQuestion.text}</div>

            {currentId === "welcome" ? (
              <div className="mt-10 flex gap-2">
                <button
                  onClick={() => setPath((p) => [...p, "start"])}
                  className="border border-primary bg-primary text-white px-4 py-2 text-sm rounded-[var(--radius)] shadow-[var(--shadow)] transition"
                >
                  Start
                </button>
              </div>
            ) : (
              <div className="mt-10 flex gap-2">
                <button
                  onClick={goBack}
                  className="border border-border px-3 py-1.5 text-sm rounded-[var(--radius)] bg-white hover:border-primary hover:shadow-[var(--shadow)] transition"
                >
                  Back
                </button>
                <button
                  onClick={handleScheduleClick}
                  className="border border-primary bg-primary text-white px-3 py-1.5 text-sm rounded-[var(--radius)] shadow-[var(--shadow)] transition inline-flex items-center justify-center appearance-none focus:outline-none focus:ring-0"
                >
                  Schedule appointment
                </button>
              </div>
            )}
          </div>

          {/* Right side: per-slide video + content */}
          <div className="min-w-0">
            {SLIDE_VIDEOS[currentId] && (
              <div className="mb-3">
                <YouTubePlayer videoId={SLIDE_VIDEOS[currentId]} />
              </div>
            )}

            {/* Grid questions (sizes or any grid) */}
            {isGrid && (
              <div
                className="grid gap-2 items-start min-w-0"
                style={{
                  gridTemplateColumns: `repeat(${
                    currentQuestion.cols || 3
                  }, minmax(0, 1fr))`,
                }}
              >
                {opts.map((opt) => (
                  <GridButton
                    key={`${currentQuestion.id}-${opt.value}`}
                    label={opt.label}
                    selected={answers[currentQuestion.id] === opt.value}
                    onClick={() => onChoose(opt)}
                  />
                ))}
              </div>
            )}

            {/* Contact form */}
            {isForm && (
              <div className="grid gap-3 min-w-0">
                <label className="text-sm font-medium" htmlFor="firstName">
                  First Name <span className="text-primary">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="First name"
                  value={contact.firstName}
                  onChange={(e) =>
                    setContact({ ...contact, firstName: e.target.value })
                  }
                  className="border border-border rounded-[var(--radius)] px-3 py-2 focus:outline-none focus:border-primary"
                />

                <label className="text-sm font-medium mt-2" htmlFor="lastName">
                  Last Name <span className="text-primary">*</span>
                </label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Last name"
                  value={contact.lastName}
                  onChange={(e) =>
                    setContact({ ...contact, lastName: e.target.value })
                  }
                  className="border border-border rounded-[var(--radius)] px-3 py-2 focus:outline-none focus:border-primary"
                />

                <label className="text-sm font-medium mt-2" htmlFor="email">
                  Email <span className="text-primary">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={contact.email}
                  onChange={(e) =>
                    setContact({ ...contact, email: e.target.value })
                  }
                  className="border border-border rounded-[var(--radius)] px-3 py-2 focus:outline-none focus:border-primary"
                />

                <label className="text-sm font-medium mt-2" htmlFor="phone">
                  Phone <span className="text-primary">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="(305) 555-0123"
                  value={contact.phone}
                  onChange={(e) =>
                    setContact({ ...contact, phone: e.target.value })
                  }
                  className="border border-border rounded-[var(--radius)] px-3 py-2 focus:outline-none focus:border-primary"
                />

                <label className="text-sm font-medium mt-2" htmlFor="notes">
                  Notes (injury history, goals, brand preference, etc.)
                </label>
                <textarea
                  id="notes"
                  placeholder="Share anything that helps us tailor your picks."
                  rows={4}
                  value={contact.notes}
                  onChange={(e) =>
                    setContact({ ...contact, notes: e.target.value })
                  }
                  className="border border-border rounded-[var(--radius)] px-3 py-2 focus:outline-none focus:border-primary resize-y"
                />

                <div className="mt-2">
                  <button
                    onClick={() =>
                      onChoose({ value: "__continue", next: "showResult" })
                    }
                    className="border border-primary bg-primary text-white px-4 py-2 text-sm rounded-[var(--radius)] shadow-[var(--shadow)] transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Simple buttons (non-grid, non-form). Hide on welcome to avoid duplicate Start */}
            {!isGrid && !isForm && currentId !== "welcome" && (
              <div className="grid grid-cols-1 gap-2 items-start min-w-0">
                {opts.map((opt) => (
                  <ChoiceButton
                    key={`${currentQuestion.id}-${opt.value}`}
                    label={opt.label}
                    selected={answers[currentQuestion.id] === opt.value}
                    onClick={() => onChoose(opt)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
