import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabaseClient";

/* --------------------- YouTube slide player ---------------------- */
function YouTubePlayer({ videoDetails }) {
  if (!videoDetails) return null;

  const { id, durationSeconds = 9999 } = videoDetails;
  const isSizzleReel = durationSeconds <= 7;

  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    rel: "0",
    controls: "0",
    modestbranding: "1",
    playsinline: "1",
  });

  if (isSizzleReel) {
    params.set("start", "0");
    params.set("end", "7");
    params.set("loop", "1");
    params.set("playlist", id);
  }

  const embedUrl = `https://www.youtube.com/embed/${id}?${params.toString()}`;

  return (
    <div className="w-full overflow-hidden rounded-[var(--radius)] bg-grey">
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={embedUrl}
          title={isSizzleReel ? "Sizzle Reel" : "Slide Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; autoplay"
          allowFullScreen
        />
      </div>
    </div>
  );
}

/* --------------------- Image carousel w/ thumbnails --------------------- */
function ImageCarousel({ images = [], alt = "", maxHeight = "22rem" }) {
  const safe = images.length ? images : ["/placeholder.png"];
  const [idx, setIdx] = useState(0);

  const go = (n) => setIdx((i) => (i + n + safe.length) % safe.length);
  const goTo = (n) => setIdx(n);

  // basic keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="w-full">
      {/* main slide */}
      <div
        className="relative overflow-hidden rounded-[var(--radius)] shadow-[var(--shadow)] bg-white"
        style={{ maxHeight }}
      >
        <img
          src={safe[idx]}
          alt={alt}
          className="w-full h-auto max-h-[22rem] object-contain bg-white"
          loading="eager"
        />

        {/* arrows */}
        {safe.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-primary/90 px-3 py-2 hover:bg-[var(--color-brand-600)] transition shadow-md text-white"
            >
              ‹
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-primary/90 px-3 py-2 hover:bg-[var(--color-brand-600)] transition shadow-md text-white"
            >
              ›
            </button>
          </>
        )}

        {/* dots */}
        {safe.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {safe.map((_, i) => (
              <span
                key={i}
                className={
                  i === idx
                    ? "h-1.5 w-4 rounded-full bg-primary"
                    : "h-1.5 w-4 rounded-full bg-[var(--color-grey)]"
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* thumbnail strip (click-to-jump) */}
      {safe.length > 1 && (
        <div className="mt-3 grid grid-flow-col auto-cols-[minmax(0,6rem)] gap-2 overflow-x-auto pb-1">
          {safe.map((src, i) => (
            <button
            key={i}
            onClick={() => goTo(i)}
            className={
              i === idx
                ? "border-2 border-primary bg-primary/10 rounded-[var(--radius)] shadow-[var(--shadow)]"
                : "border border-border rounded-[var(--radius)] hover:border-primary hover:bg-primary/5 transition"
            }
            aria-label={`Show image ${i + 1}`}
          >
            <img
              src={src}
              alt={`${alt} thumbnail ${i + 1}`}
              className="w-full h-20 object-contain rounded-[calc(var(--radius)-2px)]"
              loading="lazy"
            />
          </button>
          
          ))}
        </div>
      )}
    </div>
  );
}


/* --------------------- Category metadata --------------------- */
const CATEGORIES = {
  neutral: {
    title: "Neutral Cushion",
    blurb:
      "Balanced ride for runners with neutral gait who want shock absorption without added support.",
    img: "https://shop.footworksmiami.com/images/600/169_435600_1738690640585.jpeg",
    gallery: ["https://shop.footworksmiami.com/images/600/169_435600_1738690640585.jpeg",
    "https://shop.footworksmiami.com/images/600/169_435600_1738690640585.jpeg",
    "https://shop.footworksmiami.com/images/600/169_435600_1738690640585.jpeg"]
  },
  stability: {
    title: "Stability Support",
    blurb:
      "Extra guidance for overpronation or when you prefer a supported feel on longer runs.",
    img: "https://shop.footworksmiami.com/images/600/52_11061_1697742413640.jpg",
    gallery: ["https://shop.footworksmiami.com/images/600/52_11061_1697742413640.jpg",
    "https://shop.footworksmiami.com/images/600/52_11061_1697742413640.jpg",
    "https://shop.footworksmiami.com/images/600/52_11061_1697742413640.jpg"]

  },
  trail: {
    title: "Trail/All-Terrain",
    blurb:
      "Grippy outsole and protective upper for dirt, gravel, and uneven surfaces.",
    img: "https://shop.footworksmiami.com/images/600/35_654793_1752341671041.PNG",
    gallery: ["https://shop.footworksmiami.com/images/600/35_654793_1752341671041.PNG",
    "https://shop.footworksmiami.com/images/600/35_654793_1752341671041.PNG",
    "https://shop.footworksmiami.com/images/600/35_654793_1752341671041.PNG"]

  },
  speed: {
    title: "Speed/Tempo/Racing",
    blurb:
      "Lightweight and responsive for faster days, intervals, and race efforts.",
    img: "https://shop.footworksmiami.com/images/600/169_435600_1748447279520.png",
    gallery: ["https://shop.footworksmiami.com/images/600/169_435600_1748447279520.png",
    "https://shop.footworksmiami.com/images/600/169_435600_1748447279520.png",
    "https://shop.footworksmiami.com/images/600/169_435600_1748447279520.png"]
  },
  walking: {
    title: "Walking/Lifestyle Comfort",
    blurb:
      "Soft, supportive comfort optimized for all-day wear and recovery walks.",
    img: "https://shop.footworksmiami.com/images/600/Hoka-1134270-HMRG_1.png",
    gallery: ["https://shop.footworksmiami.com/images/600/Hoka-1134270-HMRG_1.png",
    "https://shop.footworksmiami.com/images/600/Hoka-1134270-HMRG_1.png",
    "https://shop.footworksmiami.com/images/600/Hoka-1134270-HMRG_1.png"]
  },
};

const WOMEN_US = ["5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10","10.5","11","11.5","12"];
const MEN_US   = ["7","7.5","8","8.5","9","9.5","10","10.5","11","11.5","12","12.5","13","14","15"];

/* --------------------- Question flow --------------------- */
const QUESTIONS = {
  welcome: {
    id: "welcome",
    text: "Find Your Running Shoe",
    render: "buttons",
    options: [{ label: "Start", value: "start", next: "start" }],
  },
  start: {
    id: "start",
    text: "What will you mostly do in these shoes?",
    options: [
      { label: "Road running", value: "road", next: "feel" },
      { label: "Trail running", value: "trail", next: "trail_experience" },
      { label: "Walking/casual", value: "walking", next: "sizing" },
    ],
  },
  feel: {
    id: "feel",
    text: "Which feel do you prefer underfoot?",
    options: [
      { label: "Plush cushioning", value: "plush", next: "gait" },
      { label: "Balanced everyday", value: "balanced", next: "gait" },
      { label: "Light&snappy", value: "snappy", next: "sizing" },
    ],
  },
  gait: {
    id: "gait",
    text: "Do you tend to overpronate(ankles roll inward) or prefer added support?",
    options: [
      { label: "Yes/prefer support", value: "support_yes", next: "sizing" },
      { label: "No/neutral gait", value: "support_no", next: "sizing" },
      { label: "Not sure", value: "support_unsure", next: "sizing" },
    ],
  },
  trail_experience: {
    id: "trail_experience",
    text: "What kind of terrain are you hitting most?",
    options: [
      { label: "Well-groomed paths", value: "groomed", next: "sizing" },
      { label: "Rocky/technical", value: "technical", next: "sizing" },
      { label: "Mixed road & trail", value: "mixed", next: "mixed_goal" },
    ],
  },
  mixed_goal: {
    id: "mixed_goal",
    text: "For mixed surfaces, what's your priority?",
    options: [
      { label: "Grip & protection", value: "grip", next: "sizing" },
      { label: "Lighter/faster feel", value: "fast", next: "sizing" },
    ],
  },
  sizing: {
    id: "sizing",
    text: "What type of sizing do you need?",
    options: [
      { label: "Women's Sizing", value: "women", next: "size_women" },
      { label: "Men's Sizing", value: "men", next: "size_men" },
    ],
  },
  size_women: {
    id: "size_women",
    text: "What shoe Size?",
    render: "grid",
    cols: 4,
    options: WOMEN_US.map((s) => ({ label: s, value: s, next: "price" })),
  },
  size_men: {
    id: "size_men",
    text: "What shoe Size?",
    render: "grid",
    cols: 4,
    options: MEN_US.map((s) => ({ label: s, value: s, next: "price" })),
  },
  price: {
    id: "price",
    text: "Do you have a price range?",
    render: "grid",
    cols: 2,
    options: [
      { label: "Up to $75", value: "lt75", next: "contact" },
      { label: "$75–150", value: "75_150", next: "contact" },
      { label: "Over $150", value: "gt150", next: "contact" },
      { label: "No preference", value: "nopref", next: "contact" },
    ],
  },
  contact: {
    id: "contact",
    text: "Let's keep in touch",
    render: "form",
    options: [{ label: "Continue", value: "__continue", next: "showResult" }],
  },
};

/* --------------------- Slide videos (per slide) --------------------- */
const SLIDE_VIDEOS = {
  welcome: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  feel: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  gait: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  trail_experience: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  mixed_goal: { id: "m7AqWCzoi6I", durationSeconds: 7 },
};
const RESULT_VIDEOS = {
  neutral: { id: "m7AqWCzoi6IL", durationSeconds: 7 },
  stability: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  trail: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  speed: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  walking: { id: "m7AqWCzoi6I", durationSeconds: 7 },
};

/* --------------------- Helpers --------------------- */
function calculateTotalSteps(answers) {
  const START_ID = "start";
  const END_ID = "showResult";
  const MAX_STEPS = 50;

  let steps = 0;
  let currentId = START_ID;

  while (currentId && currentId !== END_ID && steps < MAX_STEPS) {
    steps += 1;
    const question = QUESTIONS[currentId];
    if (!question || !Array.isArray(question.options) || question.options.length === 0) break;
    const userValue = answers[currentId];
    const chosenOption =
      question.options.find((opt) => opt.value === userValue) || question.options[0];

    if (chosenOption.next) currentId = chosenOption.next;
    else if (chosenOption.result) currentId = END_ID;
    else break;
  }

  return steps;
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

function ChoiceButton({ label, onClick, selected }) {
  return (
    <button
      onClick={onClick}
      className={
        selected
          ? "w-full text-center border border-primary bg-primaryOpaque px-4 py-3 text-base rounded-[var(--radius)] shadow-[var(--shadow)] transition"
          : "w-full text-center border border-border px-4 py-3 text-base rounded-[var(--radius)] bg-white hover:border-primary hover:shadow-[var(--shadow)] transition"
      }
    >
      <span className="font-medium text-almostblack">{label}</span>
    </button>
  );
}

function GridButton({ label, selected, onClick }) {
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

/* ===================== Component ===================== */
export default function ShoeSelector() {
  const STORAGE_KEY = "fw_selector_state";
  const [allowSave, setAllowSave] = useState(false);
  const [path, setPath] = useState(["welcome"]);
  const [answers, setAnswers] = useState({});
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [touched, setTouched] = useState({});
  const [hasSaved, setHasSaved] = useState(false);

  // NEW: sizzle loop key to hard-reload the 7s iframe
  const [sizzleKey, setSizzleKey] = useState(0);

  const currentId = path[path.length - 1];
  const current = QUESTIONS[currentId];
  const isResult = currentId === "showResult";

  // First real question is Step 1 (exclude "welcome")
  const currentIdx = Math.max(0, path.length - 2);
  const totalSteps = calculateTotalSteps(answers);

  const goBack = () => {
    if (path.length <= 1) return;
    setPath((p) => p.slice(0, -1));
  };

  const restart = () => {
    setPath(["welcome"]);
    setAnswers({});
    setTouched({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setHasSaved(false);
    setAllowSave(false);
  };

  /* -------- persistence: detect existing save -------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHasSaved(true);
    } catch {}
  }, []);

  /* -------- persistence: save after user acts -------- */
  useEffect(() => {
    if (!allowSave) return;
    const state = { path, answers, contact };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setHasSaved(true);
    } catch {}
  }, [allowSave, path, answers, contact]);

  const resumeFromSaved = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.path)) setPath(parsed.path);
      if (parsed.answers && typeof parsed.answers === "object") setAnswers(parsed.answers);
      if (parsed.contact && typeof parsed.contact === "object") setContact(parsed.contact);
      setAllowSave(true);
    } catch (e) {
      console.warn("Failed to resume saved state", e);
    }
  };

  const onChoice = (option) => {
    setAllowSave(true);
    setAnswers((prev) => ({ ...prev, [currentId]: option.value }));

    if (option.next === "showResult" || option.result) {
      setPath((p) => [...p, "showResult"]);
      return;
    }
    if (option.next) {
      setPath((p) => [...p, option.next]);
      return;
    }
    console.warn("No next step defined for this option:", option);
  };

  // --- validation helpers ---
  const emailValid = (value) => /^\S+@\S+\.\S+$/.test(value.trim());
  const phoneValid = (value) => /^[0-9()+\-.\s]{7,}$/.test(value.trim());

  const formValid =
    contact.firstName.trim().length > 0 &&
    contact.lastName.trim().length > 0 &&
    emailValid(contact.email) &&
    contact.phone.trim().length > 0 &&
    phoneValid(contact.phone);

  const markTouched = (name) => setTouched({ ...touched, [name]: true });

  const PRICE_LABELS = {
    lt75: "Up to $75",
    "75_150": "$75–150",
    gt150: "Over $150",
    nopref: "No preference",
  };

  const getSelectedSize = (a) => (a.sizing === "women" ? a.size_women : a.size_men);

  const buildSelectorResponse = (a, contact, categoryKey) => ({
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
  });

  const submitContact = async () => {
    if (!formValid) return;

    try {
      setAllowSave(true);
      const { data: cust, error: custErr } = await supabase
        .from("customers")
        .upsert(
          [
            {
              first_name: contact.firstName.trim(),
              last_name: contact.lastName.trim(),
              email: contact.email.trim(),
              phone_number: contact.phone?.trim(),
            },
          ],
          { onConflict: "phone_number" }
        )
        .select("id")
        .single();

      if (custErr) throw custErr;
      const customerId = cust.id;

      const payload = buildSelectorResponse(answers, contact, categoryKey);
      const { data: responseRow, error: respErr } = await supabase
        .from("shoeselectorresponses")
        .insert([{ ...payload, customer_id: customerId }])
        .select("id")
        .single();

      if (respErr) throw respErr;
// Save shoe recommendation to localStorage for scheduler to use
const rec = {
  key: categoryKey,
  title: CATEGORIES[categoryKey].title,
  blurb: CATEGORIES[categoryKey].blurb,
  img: CATEGORIES[categoryKey].img,
};
localStorage.setItem("fw_recommended", JSON.stringify(rec));

      localStorage.setItem("fw_customer_id", String(customerId));
      localStorage.setItem("fw_selector_response_id", String(responseRow.id));
      localStorage.setItem(
        "fw_contact",
        JSON.stringify({
          first_name: contact.firstName,
          last_name: contact.lastName,
          email: contact.email,
          phone_number: contact.phone,
        })
      );

      setAnswers((a) => ({ ...a, contact }));
      setPath((p) => [...p, "showResult"]);
    } catch (err) {
      console.error("Supabase (selector) error:", err);
      alert(`Couldn’t save your info. ${err.message ?? err}`);
    }
  };

  /* -------- Category mapping -------- */
  let categoryKey = "neutral";
  const activity = answers.start;
  switch (activity) {
    case "walking":
      categoryKey = "walking";
      break;
    case "trail":
      switch (answers.trail_experience) {
        case "mixed":
          categoryKey = answers.mixed_goal === "fast" ? "speed" : "trail";
          break;
        default:
          categoryKey = "trail";
          break;
      }
      break;
    case "road":
    default:
      switch (answers.gait) {
        case "support_yes":
          categoryKey = "stability";
          break;
        case "support_no":
        case "support_unsure":
          categoryKey = "neutral";
          break;
        default:
          categoryKey = answers.feel === "snappy" ? "speed" : "neutral";
          break;
      }
      break;
  }

  /* -------- Pick current slide/result video -------- */
  const slideVideo = !isResult ? SLIDE_VIDEOS[currentId] : null;
  const resultVideo = isResult ? RESULT_VIDEOS[categoryKey] : null;

  // Sizzle loop: bump key every ~7.5s for 7s clips
  useEffect(() => {
    const v = isResult ? resultVideo : slideVideo;
    const isSizzle = v && (v.durationSeconds || 9999) <= 7;
    if (!v || !isSizzle) return;
    const t = setTimeout(() => setSizzleKey((k) => k + 1), 7500);
    return () => clearTimeout(t);
  }, [currentId, isResult, slideVideo, resultVideo]);

  /* ===================== RENDER ===================== */
  return (
    <div className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white border border-border rounded-[var(--radius)] shadow-[var(--shadow)] p-5 text-almostblack text-lg">
      {!isResult ? (
        <div className="p-4 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-[35%_65%] gap-4 items-start">
            {/* Left side controls */}
            <div>
              {currentId !== "welcome" && <StepHeader idx={currentIdx} total={totalSteps} />}
              <div className="mt-10 text-lg font-semibold">{current.text}</div>

              {currentId === "welcome" ? (
                <div className="mt-10 flex gap-2">
                  {!hasSaved && (
                    <button
                      onClick={() => {
                        setAllowSave(true);
                        setPath((p) => [...p, "start"]);
                      }}
                      className="border border-primary bg-primary text-white px-4 py-2 text-sm rounded-[var(--radius)] shadow-[var(--shadow)] transition"
                    >
                      Start
                    </button>
                  )}
                  {hasSaved && (
                    <button
                      onClick={resumeFromSaved}
                      className="border border-primary bg-primary text-white px-4 py-2 text-sm rounded-[var(--radius)] shadow-[var(--shadow)] transition"
                    >
                      Resume
                    </button>
                  )}
                  {hasSaved && (
                    <button
                      onClick={restart}
                      className="border border-border bg-white px-4 py-2 text-sm rounded-[var(--radius)] hover:border-primary hover:shadow-[var(--shadow)] transition"
                      title="Clear saved progress"
                    >
                      Reset
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-10 flex gap-2">
                  <button
                    onClick={goBack}
                    className="border border-border px-3 py-1.5 text-sm rounded-[var(--radius)] bg-white hover:border-primary hover:shadow-[var(--shadow)] transition"
                    disabled={path.length <= 1}
                  >
                    Back
                  </button>
                  <Link
                    to="/scheduler"
                    className="border border-primary bg-primary text-white px-3 py-1.5 text-sm rounded-[var(--radius)] shadow-[var(--shadow)] transition inline-flex items-center"
                  >
                    Schedule appointment
                  </Link>
                </div>
              )}
            </div>

            {/* Right side content + slide video */}
            <div className="min-w-0">
              {SLIDE_VIDEOS[currentId] && (
                <div className="mb-3">
                  <YouTubePlayer
                    videoDetails={SLIDE_VIDEOS[currentId]}
                    key={`${currentId}-${sizzleKey}`}
                  />
                </div>
              )}

              {currentId === "welcome" ? (
                <div className="w-full overflow-hidden rounded-[var(--radius)]">
                  {!SLIDE_VIDEOS.welcome && (
                    <img
                      src="https://shop.footworksmiami.com/images/600/Hoka-1134270-HMRG_1.png"
                      alt="Find your perfect running shoe"
                      className="w-full h-auto max-h-56 object-contain"
                    />
                  )}
                </div>
              ) : current.render === "grid" ? (
                <div
                  className="grid gap-2 items-start min-w-0"
                  style={{ gridTemplateColumns: `repeat(${current.cols || 3}, minmax(0, 1fr))` }}
                >
                  {current.options.map((opt) => (
                    <GridButton
                      key={opt.value}
                      label={opt.label}
                      onClick={() => onChoice(opt)}
                      selected={answers[currentId] === opt.value}
                    />
                  ))}
                </div>
              ) : current.render === "form" ? (
                <div className="grid gap-3 min-w-0">
                  <label className="text-sm font-medium" htmlFor="firstName">
                    First Name <span className="text-primary">*</span>
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="First name"
                    autoComplete="given-name"
                    value={contact.firstName}
                    onBlur={() => markTouched("firstName")}
                    onChange={(e) => setContact((c) => ({ ...c, firstName: e.target.value }))}
                    className="border border-border rounded-[var(--radius)] px-3 py-2 focus:outline-none focus:border-primary"
                  />
                  {touched.firstName && contact.firstName.trim() === "" && (
                    <p className="text-xs text-red-600">First name is required.</p>
                  )}

                  <label className="text-sm font-medium mt-2" htmlFor="lastName">
                    Last Name <span className="text-primary">*</span>
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Last name"
                    autoComplete="family-name"
                    value={contact.lastName}
                    onBlur={() => markTouched("lastName")}
                    onChange={(e) => setContact((c) => ({ ...c, lastName: e.target.value }))}
                    className="border border-border rounded-[var(--radius)] px-3 py-2 focus:outline-none focus:border-primary"
                  />
                  {touched.lastName && contact.lastName.trim() === "" && (
                    <p className="text-xs text-red-600">Last name is required.</p>
                  )}

                  <label className="text-sm font-medium mt-2" htmlFor="email">
                    Email <span className="text-primary">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={contact.email}
                    onBlur={() => markTouched("email")}
                    onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                    className="border border-border rounded-[var(--radius)] px-3 py-2 focus:outline-none focus:border-primary"
                  />
                  {touched.email && !/^\S+@\S+\.\S+$/.test(contact.email.trim()) && (
                    <p className="text-xs text-red-600">Enter a valid email.</p>
                  )}

                  <label className="text-sm font-medium mt-2" htmlFor="phone">
                    Phone <span className="text-primary">*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(305) 555-0123"
                    autoComplete="tel"
                    value={contact.phone}
                    onBlur={() => markTouched("phone")}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                    className="border border-border rounded-[var(--radius)] px-3 py-2 focus:outline-none focus:border-primary"
                  />
                  {touched.phone && !/^[0-9()+\-.\s]{7,}$/.test(contact.phone.trim()) && (
                    <p className="text-xs text-red-600">Enter a valid phone number.</p>
                  )}

                  <label className="text-sm font-medium mt-2" htmlFor="notes">
                    Notes (injury history, goals, brand preference, etc.)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    placeholder="Share anything that helps us tailor your picks."
                    rows={4}
                    value={contact.notes}
                    onChange={(e) => setContact((c) => ({ ...c, notes: e.target.value }))}
                    className="border border-border rounded-[var(--radius)] px-3 py-2 focus:outline-none focus:border-primary resize-y"
                  />

                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={submitContact}
                      disabled={!formValid}
                      className={
                        formValid
                          ? "border border-primary bg-primary text-white px-4 py-2 text-sm rounded-[var(--radius)] shadow-[var(--shadow)] transition"
                          : "border border-border bg-grey/40 text-almostblack/60 px-4 py-2 text-sm rounded-[var(--radius)]"
                      }
                    >
                      Next
                    </button>
                  </div>

                  <p className="text-xs text-almostblack/70 mt-1">
                    We’ll only use your contact to send recommendations. You can opt out anytime.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 items-start min-w-0">
                  {current.options.map((opt) => (
                    <ChoiceButton
                      key={opt.value}
                      label={opt.label}
                      onClick={() => onChoice(opt)}
                      selected={answers[currentId] === opt.value}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* -------- Result view: show recommended category -------- */
        <div className="p-4 bg-white text-center">
          {(() => {
            const result = CATEGORIES[categoryKey];
            const gallery = Array.isArray(result.gallery) && result.gallery.length ? result.gallery : [result.img];


            return (
              <>
          

                <ImageCarousel images={gallery} alt={result.title} />

                <h3 className="mt-3 text-xl font-semibold text-primary">
                  Recommended: {result.title}
                </h3>
                <p className="mt-2 text-base text-almostblack/80 max-w-prose mx-auto">
                  {result.blurb}
                </p>

                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={restart}
                    className="border border-border bg-white text-sm px-4 py-2 rounded-[var(--radius)] hover:border-primary hover:shadow-[var(--shadow)] transition"
                  >
                    Start Over
                  </button>
                  <Link
                    to="/scheduler"
                    className="border border-primary bg-primary text-white px-4 py-2 text-sm rounded-[var(--radius)] shadow-[var(--shadow)] hover:bg-[var(--color-brand-600)] transition"
                  >
                    Schedule a Fitting
                  </Link>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
