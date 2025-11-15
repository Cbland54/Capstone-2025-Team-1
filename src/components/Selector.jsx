// src/components/Selector.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import WidgetBottomBar from "../components/WidgetBottomBar";

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

/* === Buttons styled like WidgetBottomBar (white default, pink hover, red when selected) === */
function ChoiceButton({ label, onClick, selected }) {
  const base =
    "w-full text-center rounded-2xl px-5 py-3 text-sm md:text-base font-medium border transition " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-400)]";
  const look = selected
    ? "bg-white text-[var(--color-brand-700)] border-[var(--color-brand-500)] hover:bg-[var(--color-brand-50)]"
    : "bg-white text-almostblack border-border hover:border-[var(--color-brand-500)] hover:bg-[var(--color-brand-50)]";
  return (
    <button type="button" onClick={onClick} aria-pressed={!!selected} className={`${base} ${look}`}>
      {label}
    </button>
  );
}

function GridButton({ label, onClick, selected }) {
  const base =
    "w-full text-center break-words rounded-2xl px-4 py-2.5 text-sm md:text-base font-medium border transition " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-400)]";
  const look = selected
    ? "bg-white text-[var(--color-brand-700)] border-[var(--color-brand-500)] hover:bg-[var(--color-brand-50)]"
    : "bg-white text-almostblack border-border hover:border-[var(--color-brand-500)] hover:bg-[var(--color-brand-50)]";
  return (
    <button type="button" onClick={onClick} aria-pressed={!!selected} className={`${base} ${look}`}>
      {label}
    </button>
  );
}

/* === Top progress (bars only, centered) === */
function TopProgress({ currentIndex, total }) {
  const safeTotal = Math.max(total, currentIndex + 1);
  return (
    <div className="mb-6">
      <div className="flex justify-center gap-2">
        {Array.from({ length: safeTotal }).map((_, i) => (
          <span
            key={i}
            className={`h-2 md:h-2.5 w-10 md:w-12 rounded-full ${
              i <= currentIndex ? "bg-[var(--color-brand-500)]" : "bg-gray-200"
            }`}
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

const PRICE_LABELS = {
  lt75: "Up to $75",
  "75_150": "$75–150",
  gt150: "Over $150",
  nopref: "No preference",
};

function getSelectedSize(a) {
  return a.sizing === "women" ? a.size_women : a.size_men;
}

function buildSelectorResponseFlat(a, contact, categoryKey) {
  return {
    running_style: a.start ?? null,
    shoe_preference: categoryKey ?? null,
    price_point: PRICE_LABELS[a.price] ?? a.price ?? null,
    gait: a.gait ?? null,
    notes: contact?.notes ?? null,
    shoe_size: getSelectedSize(a) ?? null,
    pronation: null,
    foot_width: null,
    arch_type: null,
    experience_level: null,
    preferred_brands: null,
  };
}

function normalizePhone(p) {
  return (p || "").replace(/\D/g, "");
}

/* ========================= Component ========================= */
export default function ShoeSelector() {
  const navigate = useNavigate();

  // Supabase datasets
  const [questions, setQuestions] = useState([]);
  const [options, setOptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);

  const [hydrated, setHydrated] = useState(false);

  // User state
  const [answers, setAnswers] = useState({}); // empty = no defaults selected
  const [path, setPath] = useState(["welcome"]);
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  const STORAGE_KEY = "fw_selector_state";

  // Save snapshot + scheduler-friendly contact
  function saveSnapshot(nextPath = path, nextAnswers = answers, nextContact = contact) {
    try {
      localStorage.setItem(
        "fw_selector_state",
        JSON.stringify({ path: nextPath, answers: nextAnswers, contact: nextContact })
      );
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

  // Load snapshot + fetch data
  useEffect(() => {
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
          lastName: c.last_name ?? prev.lastName ?? "",
          email: c.email ?? prev.email ?? "",
          phone: c.phone ?? c.phone_number ?? prev.phone ?? "",
        }));
      }
    } catch {}

    setHydrated(true);

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
  }, [contact, hydrated]);

  useEffect(() => {
    return () => {
      if (hydrated) saveSnapshot(path, answers, contact);
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
          setContact((prev) => ({
            ...prev,
            firstName: c.first_name ?? prev.firstName ?? "",
            lastName: c.last_name ?? prev.lastName ?? "",
            email: c.email ?? prev.email ?? "",
            phone: c.phone ?? c.phone_number ?? prev.phone ?? "",
          }));
        }
      } catch {}
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const currentId = path[path.length - 1];

  // Build options per question
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

  // Find "next" id for a question/value pair
  function getNextFor(questionId, value) {
    const opt = options.find((o) => o.question_id === questionId && o.value === value);
    return opt?.next || null;
  }

  // Determine category
  function pickCategory(a) {
    if (a.start === "walking") return "walking";
    if (a.start === "trail") {
      if (a.trail_experience === "mixed") return a.mixed_goal === "fast" ? "speed" : "trail";
      return "trail";
    }
    if (a.gait === "support_yes") return "stability";
    if (a.feel === "snappy") return "speed";
    return "neutral";
  }

  // Persist to Supabase
  async function persistSelectorToSupabase() {
    try {
      const phoneDigits = normalizePhone(contact.phone);
      if (!phoneDigits) {
        console.warn("Skipping Supabase persist: no phone");
        return { customerId: null, responseId: null };
      }

      const { data: cust, error: custErr } = await supabase
        .from("customers")
        .upsert(
          [
            {
              first_name: contact.firstName?.trim() || null,
              last_name: contact.lastName?.trim() || null,
              email: contact.email?.trim() || null,
              phone_number: phoneDigits,
            },
          ],
          { onConflict: "phone_number" }
        )
        .select("id")
        .single();
      if (custErr) throw custErr;
      const customerId = cust?.id;
      if (!customerId) throw new Error("No customer id returned from upsert");

      const categoryKey = pickCategory(answers);
      const cat = categories.find((c) => c.id === categoryKey) || {
        id: categoryKey,
        title: categoryKey,
        blurb: "",
        img: "",
      };

      const payload = buildSelectorResponseFlat(answers, contact, categoryKey);

      const { data: responseRow, error: respErr } = await supabase
        .from("shoeselectorresponses")
        .insert([{ ...payload, customer_id: customerId }])
        .select("id")
        .single();
      if (respErr) throw respErr;

      localStorage.setItem("fw_customer_id", String(customerId));
      localStorage.setItem("fw_selector_response_id", String(responseRow.id));
      localStorage.setItem(
        "fw_contact",
        JSON.stringify({
          first_name: contact.firstName || "",
          last_name: contact.lastName || "",
          email: contact.email || "",
          phone_number: phoneDigits || "",
        })
      );
      localStorage.setItem(
        "fw_recommended",
        JSON.stringify({
          key: categoryKey,
          title: cat.title,
          blurb: cat.blurb || "",
          img: cat.img || "",
        })
      );

      return { customerId, responseId: responseRow.id };
    } catch (e) {
      console.error("persistSelectorToSupabase failed:", e);
      alert(`Couldn’t save your info. ${e.message ?? e}`);
      return { customerId: null, responseId: null };
    }
  }

  /* ========== Selection + navigation ========== */

  // Click only records the selection; it does NOT advance.
  function onChoose(opt) {
    if (!opt) return;
    const qid = currentId;
    const newAnswers = { ...answers, [qid]: opt.value };
    setAnswers(newAnswers);
    saveSnapshot(path, newAnswers, contact);
  }

  function goBack() {
    if (path.length <= 1) return;
    const newPath = path.slice(0, -1);
    setPath(newPath);
    saveSnapshot(newPath, answers, contact);
  }

  function goNext() {
    // Only for non-form questions
    const value = answers[currentId];
    if (value === undefined) return;

    const nextId = getNextFor(currentId, value) || "showResult";
    const newPath = [...path, nextId];
    setPath(newPath);
    saveSnapshot(newPath, answers, contact);
  }

  async function handleScheduleClick() {
    const categoryKey = pickCategory(answers);
    const cat = categories.find((c) => c.id === categoryKey) || { id: categoryKey, title: categoryKey };

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
    await persistSelectorToSupabase();
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
  const currentQuestion = questions.find((q) => q.id === currentId);
  const isWelcome = currentId === "welcome";
  const isForm = currentQuestion?.render === "form";
  const isGrid = currentQuestion?.render === "grid";
  const opts = currentQuestion ? getOptionsFor(currentQuestion.id) : [];
  const TOTAL_STEPS = 6; // adjust if you change count
  const stepIndex = Math.max(0, path.length - 2); // first question => 0

  // Result screen
  const categoryKey = pickCategory(answers);
  const cat =
    categories.find((c) => c.id === categoryKey) || { id: categoryKey, title: categoryKey };

  if (currentId === "showResult") {
    return (
      <div className="relative w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white border border-border rounded-[var(--radius)] shadow-[var(--shadow)] p-5 text-almostblack text-lg">
        <TopProgress currentIndex={TOTAL_STEPS - 1} total={TOTAL_STEPS} />
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">Your Result</h2>

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

          <h3 className="mt-3 text-xl font-semibold text-primary">Recommended: {cat.title}</h3>
          {cat.blurb && (
            <p className="mt-2 text-base text-almostblack/80 max-w-prose mx-auto">{cat.blurb}</p>
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

        <hr className="my-6 border-[var(--color-border)]" />
        <WidgetBottomBar />
      </div>
    );
  }

  // Guard
  if (!currentQuestion) {
    return (
      <div className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl border border-red-300 bg-red-50 rounded-[var(--radius)] shadow-[var(--shadow)] p-5">
        <p className="text-sm text-red-700">Question not found.</p>
      </div>
    );
  }

  /* --- Welcome screen --- */
  if (isWelcome) {
    return (
      <div className="relative w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white border border-border rounded-[var(--radius)] shadow-[var(--shadow)] p-5 text-almostblack text-lg">
        {/* No progress on welcome */}
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">{currentQuestion.text}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div>{SLIDE_VIDEOS[currentId] && <YouTubePlayer videoId={SLIDE_VIDEOS[currentId]} />}</div>

          <div className="min-w-0 flex md:items-center">
            <button
              onClick={() => setPath((p) => [...p, "start"])}
              className="border border-primary bg-primary text-white px-6 py-3 rounded-[var(--radius)] shadow-[var(--shadow)] transition hover:bg-[var(--color-brand-600)]"
            >
              Start
            </button>
          </div>
        </div>

        <hr className="my-6 border-[var(--color-border)]" />
        <WidgetBottomBar />
      </div>
    );
  }

  /* --- Regular question screens (layout like your mock) --- */
  return (
    <div className="relative w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white border border-border rounded-[var(--radius)] shadow-[var(--shadow)] p-5 text-almostblack text-lg">
      <TopProgress currentIndex={stepIndex} total={TOTAL_STEPS} />
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">{currentQuestion.text}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: Video (if present) */}
        <div>
          {SLIDE_VIDEOS[currentId] ? (
            <YouTubePlayer videoId={SLIDE_VIDEOS[currentId]} />
          ) : (
            <div className="hidden md:block" />
          )}
        </div>

        {/* Right: answers or form */}
        <div className="min-w-0">
          {isGrid ? (
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${currentQuestion.cols || 1}, minmax(0, 1fr))` }}
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
          ) : !isForm ? (
            <div className="grid gap-3">
              {opts.map((opt) => (
                <ChoiceButton
                  key={`${currentQuestion.id}-${opt.value}`}
                  label={opt.label}
                  selected={answers[currentQuestion.id] === opt.value}
                  onClick={() => onChoose(opt)}
                />
              ))}
            </div>
          ) : null}

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
                onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
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
                onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
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
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
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
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
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
                onChange={(e) => setContact({ ...contact, notes: e.target.value })}
                className="border border-border rounded-[var(--radius)] px-3 py-2 focus:outline-none focus:border-primary resize-y"
              />

              <div className="mt-2">
                <button
                  onClick={async () => {
                    saveSnapshot(path, answers, contact);
                    await persistSelectorToSupabase();
                    const newPath = [...path, "showResult"];
                    setPath(newPath);
                    saveSnapshot(newPath, answers, contact);
                  }}
                  className="border border-primary bg-primary text-white px-4 py-2 text-sm rounded-[var(--radius)] shadow-[var(--shadow)] transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer controls  */}
      {!isForm && (
        <div className="mt-10 relative">
          <button
            onClick={goBack}
            className="border border-border bg-white px-4 py-2 text-sm rounded-[var(--radius)] hover:border-primary hover:shadow-[var(--shadow)] transition"
          >
            Back
          </button>

          <button
            onClick={goNext}
            disabled={answers[currentId] === undefined}
            className="absolute right-0 -bottom-1 md:bottom-0 border border-primary bg-primary text-white px-5 py-2 text-sm rounded-full shadow-[var(--shadow)] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      <hr className="my-6 border-[var(--color-border)]" />
      <WidgetBottomBar />
    </div>
  );
}
