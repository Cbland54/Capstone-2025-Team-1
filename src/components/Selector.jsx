import React, { useState } from "react";
import { supabase } from "./supabaseClient";

const CATEGORIES = {
  neutral: { title: "Neutral Cushion", blurb: "Balanced ride for runners with neutral gait who want shock absorption without added support.", img: "https://shop.footworksmiami.com/images/600/169_435600_1738690640585.jpeg" },
  stability:{ title: "Stability Support", blurb: "Extra guidance for overpronation or when you prefer a supported feel on longer runs.", img: "https://shop.footworksmiami.com/images/600/52_11061_1697742413640.jpg" },
  trail:    { title: "Trail/All-Terrain", blurb: "Grippy outsole and protective upper for dirt, gravel, and uneven surfaces.", img: "https://shop.footworksmiami.com/images/600/35_654793_1752341671041.PNG" },
  speed:    { title: "Speed/Tempo/Racing", blurb: "Lightweight and responsive for faster days, intervals, and race efforts.", img: "https://shop.footworksmiami.com/images/600/169_435600_1748447279520.png" },
  walking:  { title: "Walking/Lifestyle Comfort", blurb: "Soft, supportive comfort optimized for all-day wear and recovery walks.", img: "https://shop.footworksmiami.com/images/600/Hoka-1134270-HMRG_1.png" },
};

const WOMEN_US = ["5","5.5","6","6.5","7","7.5","8","8.5","9","9.5","10","10.5","11","11.5","12"];
const MEN_US   = ["7","7.5","8","8.5","9","9.5","10","10.5","11","11.5","12","12.5","13","14","15"];

const QUESTIONS = {
  welcome: { id: "welcome", text: "Find Your Running Shoe", render: "buttons", options: [{ label: "Start", value: "start", next: "start" }] },
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
      { label: "Mixed road & trail",   value: "mixed",     next: "mixed_goal" },
    ],
  },
  mixed_goal: {
    id: "mixed_goal",
    text: "For mixed surfaces, what's your priority?",
    options: [
      { label: "Grip & protection",    value: "grip", next: "sizing" },
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
      { label: "Up to $75",     value: "lt75",   next: "contact" },
      { label: "$75–150",       value: "75_150", next: "contact" },
      { label: "Over $150",     value: "gt150",  next: "contact" },
      { label: "No preference", value: "nopref", next: "contact" },
    ],
  },
  contact: {
    id: "contact",
    text: "Where can we send your picks?",
    render: "form",
    options: [{ label: "Continue", value: "__continue", next: "showResult" }],
  },
};

function calculateTotalSteps(answers) {
  const START_ID = "start";
  const END_ID = "showResult";
  const MAX_STEPS = 50; // avoid infinite loops

  let steps = 0;
  let currentId = START_ID;

  // Walk the tree until we hit the result or max steps
  while (currentId && currentId !== END_ID && steps < MAX_STEPS) {
    steps += 1;

    const question = QUESTIONS[currentId];

    // If the question is missing or has no options, break
    if (!question || !Array.isArray(question.options) || question.options.length === 0) {
      break;
    }

    // Use the user’s choice for this question, default to the first option if unselected
    const userValue = answers[currentId];
    const chosenOption =
      question.options.find((opt) => opt.value === userValue) || question.options[0];

    // Decide where to go next
    if (chosenOption.next) {
      currentId = chosenOption.next;// go to the next question
    } else if (chosenOption.result) {
      currentId = END_ID; // we’ve reached a the end
    } else {
      break; // nowhere to go, break
    }
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

export default function ShoeSelector() {
  const [path, setPath] = useState(["welcome"]);
  const [answers, setAnswers] = useState({});
  // NEW: local form state for contact step
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    notes: "",
  });
  const [touched, setTouched] = useState({});

  const currentId = path[path.length - 1];
  const current = QUESTIONS[currentId];

  // First real question is Step 1 (exclude "welcome")
  const currentIdx = Math.max(0, path.length - 2);
  const totalSteps = calculateTotalSteps(answers);

  const goBack = () => {
    if (path.length <= 1) return;
    // Removes the last item from the path (the currently viewed path)
    setPath((p) => p.slice(0, -1));
  };

  const restart = () => {
    setPath(["welcome"]);
    setAnswers({});
    //setContact({ firstName: "", lastName: "", email: "", notes: "" });
    setTouched({});
  };

  const onChoice = (option) => {
    // Save the user's choice 
    setAnswers((previousAnswers) => {
      return {
        ...previousAnswers,              // keep all previous answers
        [currentId]: option.value,       // add or replace the current question's choice
      };
    });
  
    // Figure out what happens next
    if (option.next === "showResult" || option.result) {
      // If this choice means the quiz is done, go to the results screen
      setPath((previousPath) => [...previousPath, "showResult"]);
      return;
    }
  
    if (option.next) {
      // If there’s a next question ID defined, go to that next question
      setPath((previousPath) => [...previousPath, option.next]);
      return;
    }
  
    // If there’s no next or result field, console warning
    console.warn("No next step defined for this option:", option);
  };
  

  // --- Contact form helpers ---
  const emailValid = (value) =>
    /^\S+@\S+\.\S+$/.test(value.trim());

  const formValid =
    contact.firstName.trim().length > 0 &&
    contact.lastName.trim().length > 0 &&
    emailValid(contact.email);

    const markTouched = (name) => {
      setTouched({ ...touched, [name]: true });
    };

  const PRICE_LABELS = {
    lt75: "Up to $75",
    "75_150": "$75–150",
    gt150: "Over $150",
     nopref: "No preference",
   };

  const getSelectedSize = (a) =>
  a.sizing === "women" ? a.size_women : a.size_men;

  const buildSelectorResponse = (a, contact, categoryKey) => ({
    running_style: a.start ?? null,          // "road" | "trail" | "walking"
    shoe_preference: categoryKey ?? null,    // "neutral" | "stability" | "trail" | "speed" | "walking"
    price_point: PRICE_LABELS[a.price] ?? a.price ?? null,
    gait: a.gait ?? null,                    // "support_yes" | "support_no" | "support_unsure"
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
      const { data: cust, error: custErr } = await supabase
      // upsert into the customer table, based on email
        .from("customers")
        .upsert(
          [{
            first_name: contact.firstName.trim(),
            last_name:  contact.lastName.trim(),
            email:      contact.email.trim(),
            phone_number: null, // selector doesn't ask phone
          }],
          { onConflict: "email" }
        )
        .select("id")
        .single();
  
      if (custErr) throw custErr;
      const customerId = cust.id;
  
      // Insert selector response
      const payload = buildSelectorResponse(answers, contact, categoryKey);
      const { data: responseRow, error: respErr } = await supabase
        .from("shoeselectorresponses")
        .insert([{ ...payload, customer_id: customerId }])
        .select("id")
        .single();
  
      if (respErr) throw respErr;
  
      // To do: Stash context for Scheduler to reuse
      localStorage.setItem("fw_customer_id", String(customerId));
      localStorage.setItem("fw_selector_response_id", String(responseRow.id));
      localStorage.setItem(
        "fw_contact",
        JSON.stringify({
          first_name: contact.firstName,
          last_name:  contact.lastName,
          email:      contact.email,
        })
      );
  
      // Keep  local state + move to results
      setAnswers((a) => ({ ...a, contact }));
      setPath((p) => [...p, "showResult"]);
    } catch (err) {
      console.error("Supabase (selector) error:", err);
      alert(`Couldn’t save your info. ${err.message ?? err}`);
    }
  };
  

  // Category mapping (switch-case)
  // Default category is neutral
  let categoryKey = "neutral";
  const activity = answers.start;
  // Switch on the activity (road/trail/walking)
  switch (activity) {
    case "walking":
      categoryKey = "walking";
      break;
    case "trail":
      // If trail is selected ask what kind of trail (mixed or groomed/techincal )
      switch (answers.trail_experience) {
        case "mixed":
          // If mixed, do they prefer speed or trail
          categoryKey = answers.mixed_goal === "fast" ? "speed" : "trail";
          break;
        default:
          categoryKey = "trail";
          break;
      }
      break;
    case "road":
    default:
      // If road or default ask about gait
      switch (answers.gait) {
        // support = stabiliy
        case "support_yes":
          categoryKey = "stability";
          break;
          // no or unsure = neutral
        case "support_no":
        case "support_unsure":
          categoryKey = "neutral";
          break;
        // check the feel question, speed or neutral
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
        <div className="p-4 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-[35%_65%] gap-4 items-start">
            {/* Left side of form */}
            <div>
              {currentId !== "welcome" && (
                <StepHeader idx={currentIdx} total={totalSteps} />
              )}
              <div className="mt-10 text-lg font-semibold">{current.text}</div>

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

            {/* Right side of form */}
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
                  onChange={(e) =>
                    setContact((c) => ({ ...c, firstName: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setContact((c) => ({ ...c, lastName: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setContact((c) => ({ ...c, email: e.target.value }))
                  }
                  className="border border-border rounded-[var(--radius)] px-3 py-2 focus:outline-none focus:border-primary"
                />
                {touched.email && !/^\S+@\S+\.\S+$/.test(contact.email.trim()) && (
                  <p className="text-xs text-red-600">Enter a valid email.</p>
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
                  onChange={(e) =>
                    setContact((c) => ({ ...c, notes: e.target.value }))
                  }
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
      ) : (
        <div className="p-4 bg-white">
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
