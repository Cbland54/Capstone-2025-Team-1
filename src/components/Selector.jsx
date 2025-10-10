import React, { useState } from "react";

// --- ShoeSelector (Tailwind v4 brand theme, accurate step header) ---

const CATEGORIES = {
  neutral: {
    title: "Neutral Cushion",
    blurb:
      "Balanced ride for runners with neutral gait who want shock absorption without added support.",
    img: "https://shop.footworksmiami.com/images/600/169_435600_1738690640585.jpeg",
  },
  stability: {
    title: "Stability Support",
    blurb:
      "Extra guidance for overpronation or when you prefer a supported feel on longer runs.",
    img: "https://shop.footworksmiami.com/images/600/52_11061_1697742413640.jpg",
  },
  trail: {
    title: "Trail/All-Terrain",
    blurb:
      "Grippy outsole and protective upper for dirt, gravel, and uneven surfaces.",
    img: "https://shop.footworksmiami.com/images/600/35_654793_1752341671041.PNG",
  },
  speed: {
    title: "Speed/Tempo/Racing",
    blurb:
      "Lightweight and responsive for faster days, intervals, and race efforts.",
    img: "https://shop.footworksmiami.com/images/600/169_435600_1748447279520.png",
  },
  walking: {
    title: "Walking/Lifestyle Comfort",
    blurb:
      "Soft, supportive comfort optimized for all-day wear and recovery walks.",
    img: "https://shop.footworksmiami.com/images/600/Hoka-1134270-HMRG_1.png",
  },
};

const WOMEN_US = ["5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10","10.5","11","11.5","12"];
const MEN_US   = ["7","7.5","8","8.5","9","9.5","10","10.5","11","11.5","12","12.5","13","14","15"];

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
      { label: "Road running",   value: "road",  next: "feel" },
      { label: "Trail running",  value: "trail", next: "trail_experience" },
      { label: "Walking/casual", value: "walking", next: "sizing" },
    ],
  },
  feel: {
    id: "feel",
    text: "Which feel do you prefer underfoot?",
    options: [
      { label: "Plush cushioning",  value: "plush",    next: "gait" },
      { label: "Balanced everyday", value: "balanced", next: "gait" },
      { label: "Light&snappy",      value: "snappy",   next: "sizing" },
    ],
  },
  gait: {
    id: "gait",
    text: "Do you tend to overpronate(ankles roll inward) or prefer added support?",
    options: [
      { label: "Yes/prefer support", value: "support_yes",   next: "sizing" },
      { label: "No/neutral gait",    value: "support_no",    next: "sizing" },
      { label: "Not sure",           value: "support_unsure",next: "sizing" },
    ],
  },
  trail_experience: {
    id: "trail_experience",
    text: "What kind of terrain are you hitting most?",
    options: [
      { label: "Well-groomed paths", value: "groomed",   next: "sizing" },
      { label: "Rocky/technical",    value: "technical", next: "sizing" },
      { label: "Mixed road&trail",   value: "mixed",     next: "mixed_goal" },
    ],
  },
  mixed_goal: {
    id: "mixed_goal",
    text: "For mixed surfaces, what's your priority?",
    options: [
      { label: "Grip&protection",    value: "grip", next: "sizing" },
      { label: "Lighter/faster feel",value: "fast", next: "sizing" },
    ],
  },
  sizing: {
    id: "sizing",
    text: "What type of sizing do you need?",
    options: [
      { label: "Women's Sizing", value: "women", next: "size_women" },
      { label: "Men's Sizing",   value: "men",   next: "size_men" },
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
      { label: "Up to $75",   value: "lt75",   next: "contact" },
      { label: "$75–150",     value: "75_150", next: "contact" },
      { label: "Over $150",   value: "gt150",  next: "contact" },
      { label: "No preference", value: "nopref", next: "contact" },
    ],
  },
  contact: {
    id: "contact",
    text: "Where can we send your picks?",
    render: "form",
  },
};

// --- Accurate total: walk the graph from "start" using current answers (fallback to first option)
function computePlannedTotal(answers) {
  let total = 0;
  let id = "start";
  let safety = 50;

  while (id && id !== "showResult" && safety-- > 0) {
    total++;
    const q = QUESTIONS[id];
    if (!q || !q.options || q.options.length === 0) break;

    const chosen = q.options.find((o) => o.value === answers[id]) || q.options[0];

    if (chosen.next) {
      id = chosen.next;
    } else if (chosen.result) {
      id = "showResult";
    } else {
      break;
    }
  }
  return total;
}

function StepHeader({ idx, total }) {
  // Ensure we render at least idx+1 dots so the current step is visible
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
                : "h-1.5 w-4 rounded-[9999px] bg-border"
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

export default function ShoeSelector() {
  const [path, setPath] = useState(["welcome"]);
  const [answers, setAnswers] = useState({});

  const currentId = path[path.length - 1];
  const current = QUESTIONS[currentId];

  // First real question is Step 1 (exclude "welcome")
  const currentIdx = Math.max(0, path.length - 2);
  const plannedTotal = computePlannedTotal(answers);

  const goBack = () => {
    if (path.length <= 1) return;
    setPath((p) => p.slice(0, -1));
  };

  const restart = () => {
    setPath(["welcome"]);
    setAnswers({});
  };

  const onChoose = (opt) => {
    setAnswers((a) => ({ ...a, [currentId]: opt.value }));

    if (opt.next === "showResult") {
      setPath((p) => [...p, "showResult"]);
      return;
    }
    if (opt.next) {
      setPath((p) => [...p, opt.next]);
      return;
    }
    if (opt.result) {
      setPath((p) => [...p, "showResult"]);
      return;
    }
  };

  // Category mapping (switch-case)
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

  const isResult = currentId === "showResult";

  return (
    <div className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white border border-border rounded-[var(--radius)] shadow-[var(--shadow)] p-5 text-almostblack text-lg">
      {!isResult ? (
        <div className="border border-border rounded-[var(--radius)] p-4 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-[35%_65%] gap-4 items-start">
            {/* Left: progress + big question + (Back or Start) */}
            <div>
              {currentId !== "welcome" && (
                <StepHeader idx={currentIdx} total={plannedTotal} />
              )}
              <div className="mt-10 text-lg font-semibold">{current.text}</div>

              {/* Step controls: welcome vs others */}
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
                    disabled={path.length <= 1}
                  >
                    Back
                  </button>
                </div>
              )}
            </div>

            {/* Right: answers OR welcome image */}
            {currentId === "welcome" ? (
              <div className="overflow-hidden rounded-[var(--radius)] bg-grey min-h-40 flex items-center justify-center">
                <img
                  src="https://shop.footworksmiami.com/images/600/Hoka-1134270-HMRG_1.png"
                  alt="Find your perfect running shoe"
                  className="w-full h-auto max-h-56 object-contain"
                />
              </div>
            ) : current.render === "grid" ? (
              <div
                className="grid gap-2 items-start min-w-0"
                style={{
                  gridTemplateColumns: `repeat(${current.cols || 3}, minmax(0, 1fr))`,
                }}
              >
                {current.options.map((opt) => (
                  <GridButton
                    key={opt.value}
                    label={opt.label}
                    onClick={() => onChoose(opt)}
                    selected={answers[currentId] === opt.value}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 items-start min-w-0">
                {current.options.map((opt) => (
                  <ChoiceButton
                    key={opt.value}
                    label={opt.label}
                    onClick={() => onChoose(opt)}
                    selected={answers[currentId] === opt.value}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-[var(--radius)] p-4 bg-white">
          {(() => {
            const result = CATEGORIES[categoryKey];
            return (
              <>
                <div className="overflow-hidden rounded-[var(--radius)] bg-grey">
                  {result?.img ? (
                    <img
                      src={result.img}
                      alt={result.title}
                      className="w-full h-auto max-h-48 object-contain mx-auto"
                    />
                  ) : null}
                </div>
                <h3 className="mt-3 text-lg font-semibold">
                  Recommended: {result.title}
                </h3>
                <p className="mt-2 text-base text-almostblack/80">
                  {result.blurb}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="border border-border px-4 py-2 text-sm rounded-[var(--radius)] bg-white hover:border-primary hover:shadow-[var(--shadow)] transition"
                    onClick={restart}
                  >
                    Start over
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
