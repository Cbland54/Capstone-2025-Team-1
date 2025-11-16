// === Import Statements ===
// Importing React core features and hooks
import React, { useState, useEffect } from "react";

// Importing Calendar component and its styling for date selection
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// Importing Supabase client for database interactions
import { supabase } from "./supabaseClient";

// Import Email confirmation components
import emailjs from "@emailjs/browser";

// === Main Component ===
// SmartScheduler handles the full flow of booking an appointment:
// - Step 1: Contact Info
// - Step 2: Service Selection
// - Step 3: Date, Time, Associate Selection (with availability filtering)
// - Step 4: Review & Submit
// - Step 5: Confirmation
export default function SmartScheduler() {
  // === Component State ===
  // step: tracks the current step of the booking flow (1–5)
  const [step, setStep] = useState(1);

  // status: shows messages (success or error) to the user
  const [status, setStatus] = useState({ message: "", type: "" });

  // associates: all active associates fetched from the database
  const [associates, setAssociates] = useState([]);

  // filteredAssociates: only associates available on selected date
  const [filteredAssociates, setFilteredAssociates] = useState([]);

  // selectedDate: the date chosen by the user from the calendar
  const [selectedDate, setSelectedDate] = useState(new Date());

  // availableTimes: time slots available for the selected associate on the selected date
  const [availableTimes, setAvailableTimes] = useState([]);

  // error: field validation errors displayed to the user
  const [error, setError] = useState("");

  // form: stores all user input for the booking (contact, services, date/time, associate)
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    services: [],
    date: "",
    time: "",
    associate: null,
  });

  // Store recommended shoe info from Shoe Selector
  const [recommended, setRecommended] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fw_recommended");
      if (raw) {
        setRecommended(JSON.parse(raw));
      }
    } catch (e) {
      console.warn("Could not parse fw_recommended from localStorage", e);
    }
  }, []);

  // Predefined list of services
  const servicesList = [
    {
      name: "Running Shoe Fitting",
      description: "Get professionally fitted for the perfect running shoes.",
      duration: "30 min",
      videoId: "m7AqWCzoi6I",
    },
    {
      name: "Gait Analysis",
      description: "Analyze your running/walking gait to improve performance.",
      duration: "45 min",
      videoId: "m7AqWCzoi6I",
    },
    {
      name: "Orthotic Consultation",
      description: "Custom orthotic recommendations for your feet.",
      duration: "40 min",
      videoId: "m7AqWCzoi6I",
    },
    {
      name: "Injury Prevention Advice",
      description: "Learn exercises and strategies to prevent injuries.",
      duration: "20 min",
      videoId: "m7AqWCzoi6I",
    },
  ];

  /* ---------------- YouTube Player ---------------- */
  function YouTubePlayer({ videoId, isSizzle = false }) {
    if (!videoId) return null;

    const params = new URLSearchParams({
      autoplay: "1",
      mute: "1",
      rel: "0",
      controls: "0",
      modestbranding: "1",
      playsinline: "1",
    });

    if (isSizzle) {
      params.set("start", "0");
      params.set("end", "7");
      params.set("loop", "1");
      params.set("playlist", videoId);
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;

    return (
      <div className="w-full overflow-hidden rounded-[var(--radius)] bg-gray-100">
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          <iframe
            key={videoId + (isSizzle ? "-sizzle" : "")}
            className="absolute inset-0 w-full h-full"
            src={embedUrl}
            title="Intro Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  /* ---------------- Slide Videos ---------------- */
  const SLIDE_VIDEOS = {
    welcome: { id: "m7AqWCzoi6I", durationSeconds: 7 },
    feel: { id: "m7AqWCzoi6I", durationSeconds: 7 },
    gait: { id: "m7AqWCzoi6I", durationSeconds: 7 },
    trail_experience: { id: "m7AqWCzoi6I", durationSeconds: 7 },
    mixed_goal: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  };

  const stepVideos = {
    1: SLIDE_VIDEOS.welcome,
    2: SLIDE_VIDEOS.feel,
    3: SLIDE_VIDEOS.gait,
    4: SLIDE_VIDEOS.trail_experience,
    5: SLIDE_VIDEOS.mixed_goal,
  };

  const [sizzleKey, setSizzleKey] = useState(0);
  const slideVideo = stepVideos[step];
  const isSizzle = slideVideo?.durationSeconds <= 7;

  useEffect(() => {
    if (!slideVideo || !isSizzle) return;
    const t = setTimeout(() => setSizzleKey((k) => k + 1), 7500);
    return () => clearTimeout(t);
  }, [step, slideVideo, isSizzle]);

  // === Load Saved Contact Info on Mount (FIXED dependency array) ===
  useEffect(() => {
    const saved = localStorage.getItem("fw_contact");
    if (!saved) return;
    try {
      const c = JSON.parse(saved);
      setForm((f) => ({
        ...f,
        first_name: c.first_name ?? f.first_name ?? "",
        last_name: c.last_name ?? f.last_name ?? "",
        email: c.email ?? f.email ?? "",
        phone: c.phone ?? c.phone_number ?? f.phone ?? "",
      }));
    } catch (e) {
      console.warn("Could not parse fw_contact from localStorage", e);
    }
  }, []); // <-- Corrected; previously had stray brace causing syntax error

  // === Fetch Associates ===
  useEffect(() => {
    const fetchAssociates = async () => {
      const { data, error } = await supabase
        .from("staffschedules")
        .select("*")
        .eq("is_active", true);
      if (!error && data) {
        setAssociates(data);
        setFilteredAssociates(data);
      }
    };
    fetchAssociates();
  }, []);

  const weekdayKeyFromDate = (date) => {
    const jsShort = date
      .toLocaleDateString("en-US", { weekday: "short" })
      .slice(0, 3);
    const map = {
      Mon: "Mon",
      Tue: "Tue",
      Wed: "Wed",
      Thu: "Thr",
      Fri: "Fri",
      Sat: "Sat",
      Sun: "Sun",
    };
    return map[jsShort] ?? jsShort;
  };

  const getDayRangeForAssociate = (associate, date) => {
    try {
      const raw = associate?.availability;
      const avail = typeof raw === "string" ? JSON.parse(raw) : raw;
      const dayKey = weekdayKeyFromDate(date);
      return avail?.[dayKey];
    } catch (e) {
      console.error("Error parsing availability for associate:", e);
      return undefined;
    }
  };

  const getNextThreeAppointments = () => {
    const today = new Date();
    const availableToday = associates.filter((a) => {
      const range = getDayRangeForAssociate(a, today);
      return range && String(range).toLowerCase() !== "off";
    });
    if (availableToday.length === 0) return [];
    const allAppointments = [];
    availableToday.forEach((associate) => {
      const times = generateTimeSlotsFromRange(
        getDayRangeForAssociate(associate, today)
      );
      times.forEach((time) => {
        const [hour, minute] = time.split(":").map(Number);
        const appointmentDateTime = new Date(today);
        appointmentDateTime.setHours(hour, minute, 0, 0);
        if (appointmentDateTime > new Date()) {
          allAppointments.push({ associate, time, datetime: appointmentDateTime });
        }
      });
    });
    allAppointments.sort((a, b) => a.datetime - b.datetime);
    return allAppointments.slice(0, 3);
  };

  const parseRangeTo24 = (range) => {
    if (!range || typeof range !== "string") return null;
    const parts = range.split("-").map((p) => p.trim());
    if (parts.length !== 2) return null;
    let start = parseInt(parts[0], 10);
    let end = parseInt(parts[1], 10);
    if (Number.isNaN(start) || Number.isNaN(end)) return null;
    if (end <= start) end = end + 12;
    if (start < 0) start = 0;
    if (end > 23) end = 23;
    return { start, end };
  };

  const formatToAmPm = (time24) => {
    if (!time24) return "";
    const [hourStr, minuteStr] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minuteStr} ${ampm}`;
  };

  const generateTimeSlotsFromRange = (range) => {
    if (!range) return [];
    if (range.toLowerCase && range.toLowerCase() === "off") return [];
    const parsed = parseRangeTo24(range);
    if (!parsed) return [];
    const times = [];
    for (let h = parsed.start; h <= parsed.end; h++) {
      const hh = String(h).padStart(2, "0");
      times.push(`${hh}:00`);
    }
    return times;
  };

  useEffect(() => {
    if (!associates || associates.length === 0) {
      setFilteredAssociates([]);
      return;
    }
    const filtered = associates.filter((a) => {
      const dayRange = getDayRangeForAssociate(a, selectedDate);
      return dayRange && String(dayRange).toLowerCase() !== "off";
    });
    setFilteredAssociates(filtered);

    // If current associate is no longer available, clear selection & time
    if (form.associate && !filtered.find((fa) => fa.id === form.associate.id)) {
      setForm((f) => ({ ...f, associate: null, time: "" }));
      setAvailableTimes([]);
    }
  }, [selectedDate, associates]);

  useEffect(() => {
    if (!form.associate) {
      setAvailableTimes([]);
      return;
    }
    const range = getDayRangeForAssociate(form.associate, selectedDate);
    const times = generateTimeSlotsFromRange(range);
    setAvailableTimes(times);
    if (form.time && !times.includes(form.time)) {
      setForm((f) => ({ ...f, time: "" }));
    }
  }, [form.associate, selectedDate]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const toggleService = (service) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const nextStep = () => {
    setError("");
    if (step === 4) {
      if (
        !form.first_name ||
        !form.last_name ||
        !form.email ||
        !form.phone
      ) {
        setError("Please fill out all contact fields before proceeding.");
        return;
      }
      const phoneRegex = /^\d{10}$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
      if (!phoneRegex.test(form.phone.trim())) {
        setError("Please enter a valid 10-digit phone number.");
        return;
      }
    } else if (step === 2) {
      if (form.services.length === 0) {
        setError("Please select at least one service.");
        return;
      }
    } else if (step === 3) {
      if (!form.date || !form.time || !form.associate) {
        setError("Please select a date, time, and associate.");
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const prevStep = () => {
    setError("");
    setStep((s) => s - 1);
  };

  const handleQuickBook = () => {
    const nextAppointments = getNextThreeAppointments();
    if (nextAppointments.length === 0) {
      setStatus({ message: "No available appointments today.", type: "error" });
      return;
    }
    const firstAppt = nextAppointments[0];
    setSelectedDate(new Date());
    setForm((f) => ({
      ...f,
      date: new Date().toISOString().split("T")[0],
      time: firstAppt.time,
      associate: firstAppt.associate,
    }));
    setStep(4);
  }; 

  const handleSubmit = async () => {
    if (
      !form.first_name ||
      !form.last_name ||
      !form.email ||
      !form.phone ||
      !form.date ||
      !form.time ||
      !form.associate
    ) {
      setStatus({
        message: "Please fill out all required fields.",
        type: "error",
      });
      return;
    }

    try {
      setStatus({ message: "Booking...", type: "" });
      const { data: cust, error: custErr } = await supabase
        .from("customers")
        .upsert(
          [
            {
              first_name: form.first_name.trim(),
              last_name: form.last_name.trim(),
              email: form.email.trim(),
              phone_number: form.phone.trim(),
            },
          ],
          { onConflict: "phone_number" }
        )
        .select("id")
        .single();
      if (custErr) throw custErr;
      const customerId = cust.id;

     // Retrieve associated shoe selector response (if any)
let selectorResponseId = null;

const { data: resp, error: respFindErr } = await supabase
  .from("shoeselectorresponses")
  .select("id")
  .eq("customer_id", customerId)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (respFindErr) {
  console.error("Error fetching shoe selector response:", respFindErr);
} else if (resp) {
  selectorResponseId = resp.id;
}
      // Combine date & time for appointment
      const appointmentDateTime = `${form.date}T${form.time}`;

      // Insert appointment into database
      const { error: apptErr } = await supabase.from("appointments").insert([
        {
          staff_schedule_id: form.associate.id,
          appointment_datetime: appointmentDateTime,
          reminder_sent: false,
          service: form.services.join(", "),
          shoeselectorresponse_id: selectorResponseId,
          customer_id: customerId,
        },
      ]);
      if (apptErr) throw apptErr;

   // Send confirmation email via EmailJS 
try {
  console.log("📤 Attempting to send confirmation email to:", form.email);

  const emailParams = {
    to_email: form.email,
    customer_name: `${form.first_name} ${form.last_name}`,
    staff_name: form.associate?.staff_name,
    appointment_date: form.date,
    appointment_time: form.time,
    services: form.services.join(", "),
  };

  console.log("📄 Email parameters:", emailParams);

  const response = await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    emailParams,
    EMAILJS_PUBLIC_KEY
  );

  console.log("✅ EmailJS response:", response);
  console.log("✅ Confirmation email sent successfully!");

  // Optionally update status only on email success
  setStatus({
    message: "Appointment booked successfully! Confirmation email sent.",
    type: "success",
  });
} catch (emailErr) {
  // EmailJS returns error as an object with status and text
  console.error("❌ Failed to send confirmation email:", emailErr);
  setStatus({
    message: `Appointment booked, but email failed: ${
      emailErr.text || emailErr.message || "Unknown error"
    }`,
    type: "error",
  });
}

      // Show success status & advance to confirmation step
      setStatus({ message: "Appointment booked successfully!", type: "success" });
      setStep(6);
      localStorage.setItem("fw_customer_id", String(customerId));
      localStorage.removeItem("fw_contact");
    } catch (err) {
      console.error("Supabase (scheduler) error:", err);
      setStatus({
        message: err.message ?? "Something went wrong.",
        type: "error",
      });
    }
  };

  // === Time button default ===
  const timesToShow = form.associate ? availableTimes : [];

  // === JSX Rendering ===
  return (
    <div className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white border border-border rounded-[var(--radius)] shadow-[var(--shadow)] p-5 text-almostblack text-lg">
      {/* Booking Header */}
      <h2 className="text-center text-2xl font-bold mb-6">
        Book Your Appointment
      </h2>

      {/* Progress Bar showing current step */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 mx-1 rounded-full ${
              step >= s ? "bg-primary" : "bg-gray-200"
            }`}
          ></div>
        ))}
      </div>


{step === 1 && (
  <div className="mt-2 flex flex-col items-center text-center md:items-start md:text-left">
    <h3 className="text-lg font-semibold mb-6 text-center md:text-left">
      Welcome, choose a quick appointment or view all options.
    </h3>

    <div className="flex flex-col md:flex-row items-start justify-center gap-8 w-full">
      {/* LEFT: Quick-book buttons with descriptor */}
      <div className="flex flex-col gap-4 items-start flex-1">
        
           <p className="text-gray-600 text-sm mb-4">
          <br />Short on time? Pick the next available slot. We will discuss your service needs when you arrive.
        </p>
        

        <div className="flex flex-col gap-3 items-start">
          {getNextThreeAppointments().map((appt, idx) => {
            const selected =
              form.associate?.id === appt.associate.id &&
              form.time === appt.time;

            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedDate(new Date());
                  setForm((f) => ({
                    ...f,
                    date: new Date().toISOString().split("T")[0],
                    time: appt.time,
                    associate: appt.associate,
                  }));
                  setStep(4);
                }}
                className={[
                  "inline-flex items-center justify-center text-center whitespace-nowrap",
                  "px-5 py-2.5 rounded-[var(--radius)] text-sm font-semibold",
                  "border border-[var(--color-border)] shadow-[var(--shadow-soft)] transition-all duration-150",
                  "bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] hover:-translate-y-0.5 hover:shadow-md active:scale-[.97]",
                  selected ? "ring-2 ring-[var(--color-brand-400)] scale-[1.02]" : "",
                ].join(" ")}
                style={{ width: "fit-content", minWidth: "unset" }}
              >
                {formatToAmPm(appt.time)} with {appt.associate.staff_name}
              </button>
            );
          })}

          {getNextThreeAppointments().length === 0 && (
            <span className="text-sm text-gray-500">
              No openings today — use “View All Options”.
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:flex w-px bg-[var(--color-accent-200)] self-stretch" />
      <div className="md:hidden h-px w-24 bg-[var(--color-accent-200)] my-4" />

      {/* RIGHT: View All Options with descriptor */}
      <div className="flex flex-col items-start justify-start flex-1">
        <h4 className="font-semibold text-base text-gray-900 mb-1">
          
        </h4>
        <br />
        <button
          onClick={() => setStep(2)}
          className="border border-[var(--color-accent-300)] bg-[var(--color-accent-100)] text-[var(--color-accent-900)]
                     hover:bg-[var(--color-accent-200)] hover:-translate-y-0.5 hover:shadow-md active:scale-[.98]
                     px-6 py-3 rounded-[var(--radius)] shadow-[var(--shadow)] transition
                     text-base font-medium"
        >
          Book Appointment
        </button>
        <p className="text-gray-600 text-sm mb-4">
          <br />Prefer another day, time, or service? See the full schedule.
        </p>
      </div>
    </div>
  </div>
)}



{step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Select Services</h3>

    <div className="flex flex-col gap-4">
      {servicesList.map((service) => {
        const isSelected = form.services.includes(service.name);

        return (
          <div
            key={service.name}
            className={`p-3 border rounded-lg transition flex items-start gap-4 ${
              isSelected ? "border-[#001d4a] bg-[#001d4a]/5" : "border-gray-300 bg-white"
            }`}
          >
            {/* Checkbox + Text Info */}
            <label className="flex-1 flex flex-col gap-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleService(service.name)}
                  className="mt-1"
                />
                <p className="font-semibold">{service.name}</p>
              </div>
              <p className="text-sm text-gray-600">{service.description}</p>
              <p className="text-sm text-gray-500">Duration: {service.duration}</p>
            </label>

            {/* Video Thumbnail / Player */}
            <div
              className={`relative transition-all duration-300 flex-shrink-0 rounded-md border border-gray-200 overflow-hidden ${
                isSelected ? "w-80 h-48" : "w-24 h-16"
              }`}
            >
              {isSelected ? (
                <YouTubePlayer videoId={service.videoId} isSizzle={false} />
              ) : (
                <img
                  src={`https://img.youtube.com/vi/${service.videoId}/hqdefault.jpg`}
                  alt={`${service.name} thumbnail`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>

    {error && <p className="text-red-600 text-sm">{error}</p>}

    {/* Navigation buttons */}
    <div className="flex justify-between mt-6">
      <button
        onClick={prevStep}
        className="border border-border px-3 py-1.5 text-sm rounded bg-white hover:border-primary transition"
      >
        Back
      </button>
      <button
        data-testid="next-services"
        onClick={nextStep}
        className="border border-primary bg-primary text-white px-4 py-2 rounded shadow transition"
      >
        Next
      </button>
    </div>
  </div>
)}


      {/* Step 3: Calendar, Time, Associate Selection */}
      {step === 3 && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Calendar */}
          <div className="flex-shrink-0 w-full md:w-1/2 bg-white rounded-2xl shadow-md p-4">
            <h3 className="text-lg font-semibold mb-2">Select a Date</h3>
            <Calendar
              onChange={(date) => {
                setSelectedDate(date);
                setForm({ ...form, date: date.toISOString().split("T")[0] });
              }}
              value={selectedDate}
              minDate={new Date()}
            />
          </div>

          {/* Time & Associate Selection */}
<div className="w-full md:w-1/2 bg-white rounded-2xl shadow-md p-4 flex flex-col gap-4">
  {/* Time Buttons */}
  <div>
    <label className="block font-semibold text-sm mb-1">
      Select Time
    </label>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {timesToShow.length > 0 ? (
        timesToShow.map((t) => (
          <button
            key={t}
            onClick={() => setForm({ ...form, time: t })} // store 24h
            className={`p-2 rounded-lg border transition-all duration-150 ${
              form.time === t
                ? "bg-[#001d4a] text-white border-[#001d4a]"
                : "bg-gray-100 hover:bg-gray-200 border-gray-300"
            }`}
          >
            {formatToAmPm(t)} {/* display in AM/PM */}
          </button>
        ))
      ) : (
        <p className="text-gray-500 text-sm">
          {form.associate ? "No times available" : "Please select an associate first"}
        </p>
      )}
    </div>
  </div>

            {/* Associate Dropdown */}
            <div>
              <label htmlFor="associate-select" className="block font-semibold text-sm mb-1">
                Select Associate
              </label>
              <select
                id="associate-select"
                value={form.associate?.id || ""}
                onChange={(e) => {
                  const selected = filteredAssociates.find(
                    (a) => a.id === parseInt(e.target.value, 10)
                  );
                  setForm({ ...form, associate: selected, time: "" });
                }}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">
                  -- Choose an available associate --
                </option>
                {filteredAssociates.length > 0 ? (
                  filteredAssociates.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.staff_name}
                    </option>
                  ))
                ) : (
                  <option disabled>No associates available</option>
                )}
              </select>
            </div>

            {form.associate?.bio && (
  <div className="mt-3 p-3 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-700">
    <h4 className="font-semibold mb-1 text-gray-800">About {form.associate.staff_name}</h4>
    <p>{form.associate.bio}</p>
  </div>
)}
            {error && <p className="text-red-600 text-sm">{error}</p>}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
              <button
                onClick={prevStep}
                className="border border-border px-3 py-1.5 text-sm rounded bg-white hover:border-primary transition"
              >
                Back
              </button>
              <button
                data-testid="next-date-time"
                onClick={nextStep}
                className="border border-primary bg-primary text-white px-4 py-2 rounded shadow transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Contact Info */}
      {step === 4 && (
        <div className="space-y-5">
          <div>
<label htmlFor="first_name" className="block font-semibold text-sm mb-1">First Name</label>
<input
  id="first_name"
  type="text"
  name="first_name"
  value={form.first_name}
  onChange={handleChange}
  className="w-full border border-gray-300 rounded-md p-2"
  required
/>


          </div>
          <div>
            <label htmlFor="last_name" className="block font-semibold text-sm mb-1">Last Name</label>
            <input
              id="last_name"
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block font-semibold text-sm mb-1">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="phone" className="block font-semibold text-sm mb-1">Phone</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          {/* Display validation error if present */}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Navigation button */}
         
        <div className="flex justify-between mt-6">
          {/* Back button on the left */}
        <button onClick={prevStep}
        className="border border-border px-3 py-1.5 text-sm rounded bg-white hover:border-primary transition">
        Back
        </button>

          {/* Next button on the right */}
                      <button data-testid="next-contact"
                          onClick={nextStep}
                        className="border border-primary bg-primary text-white px-4 py-2 rounded shadow transition">
        Next
        </button>
        </div>
      </div>
      )}

 {step === 5 && (
  <div className="space-y-8">
    <div className="text-center">
      <h3 className="text-2xl font-bold text-gray-800">Review Your Appointment</h3>
      <p className="text-gray-600 mt-1">
        Please double-check your details before confirming.
      </p>
    </div>

    {/* Appointment Summary */}
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 shadow-sm">
      <h4 className="text-lg font-semibold text-gray-800 mb-3">
        Appointment Summary
      </h4>
      <p><span className="font-medium">Date:</span> {form.date}</p>
      <p><span className="font-medium">Time:</span> {formatToAmPm(form.time)}</p>
      <p>
        <span className="font-medium">Associate:</span> {form.associate?.staff_name}
      </p>

      {form.associate?.bio && (
        <p className="mt-1 text-sm text-gray-600 italic">
          “{form.associate.bio}”
        </p>
      )}
      {form.associate?.photo && (
        <div className="mt-3 flex justify-center">
          <img
            src={form.associate.photo}
            alt={form.associate.staff_name}
            className="w-24 h-24 object-cover rounded-full border border-gray-300 shadow-sm"
          />
        </div>
      )}
    </div>

{/* Services Section */}
<div className="space-y-4">
  <h4 className="text-lg font-semibold text-gray-800">Selected Services</h4>

  {form.services.length === 0 ? (
    <p className="text-gray-600 italic">
      Since you've chosen a quick appointment, we'll discuss your service needs when you arrive.
    </p>
  ) : (
    form.services.map((serviceName) => {
      const service = servicesList.find((s) => s.name === serviceName);
      return (
        <div
          key={serviceName}
          className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex items-start gap-4"
        >
          {/* Left: Text Info */}
          <div className="flex-1">
            <h5 className="font-semibold text-lg text-[#001d4a]">{service.name}</h5>
            <p className="text-gray-600 text-sm">{service.description}</p>
            <p className="text-gray-500 text-sm mt-1">Duration: {service.duration}</p>
          </div>

          {/* Right: Small Thumbnail */}
          <div className="w-32 h-20 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
            <img
              src={`https://img.youtube.com/vi/${service.videoId}/hqdefault.jpg`}
              alt={`${service.name} thumbnail`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      );
    })
  )}
</div>
{/* Recommended Shoe Section */}
{recommended && (
  <div className="mt-8 border-t pt-6 text-center">
    <h4 className="text-lg font-semibold text-primary mb-3">
      Your Recommended Shoe Type
    </h4>
    <div className="flex flex-col items-center justify-center">
      {recommended.img && (
        <img
          src={recommended.img}
          alt={recommended.title}
          className="w-40 h-auto rounded-[var(--radius)] shadow-[var(--shadow)] mb-3"
        />
      )}
      <p className="font-medium text-gray-900">{recommended.title}</p>
      {recommended.blurb && (
        <p className="text-sm text-gray-600 max-w-md mt-2">
          {recommended.blurb}
        </p>
      )}
    </div>
  </div>
)}


    {/* Navigation + Submit */}
    <div className="flex justify-between pt-6">
      <button
        onClick={prevStep}
        className="border border-border px-4 py-2 text-sm rounded bg-white hover:border-primary transition"
      >
        Back
      </button>
      <button
        onClick={handleSubmit}
        className="px-6 py-3 bg-[#001d4a] text-white rounded-lg shadow hover:bg-gray-700 transition"
      >
        Confirm & Book
      </button>
    </div>
  </div>
)}


      {/* Step 6: Confirmation */}
      {step === 6 && (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-green-600 mb-2">
            Appointment Confirmed!
          </h3>
          <p>Your appointment with {form.associate?.staff_name} has been booked.</p>
        </div>
      )}

      {/* Display status message */}
      {status.message && (
        <p
          className={`mt-4 text-center font-medium ${
            status.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
