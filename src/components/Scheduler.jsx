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

  // servicesList: predefined list of services the user can choose from
  const servicesList = [
    "Running Shoe Fitting",
    "Gait Analysis",
    "Orthotic Consultation",
    "Injury Prevention Advice",
  ];

  /* --------------------- Slide videos (per slide) ---------------------
   use youtube id + durationSeconds (for sizzle loop detection)
-------------------------------------------------------------------- */
const SLIDE_VIDEOS = {
  welcome: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  feel: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  gait: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  trail_experience: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  mixed_goal: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  // showResult handled separately
};
const RESULT_VIDEOS = {
  neutral: { id: "m7AqWCzoi6IL", durationSeconds: 7 },
  stability: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  trail: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  speed: { id: "m7AqWCzoi6I", durationSeconds: 7 },
  walking: { id: "m7AqWCzoi6I", durationSeconds: 7 },
};

  // Email confirmation info
  //const EMAILJS_SERVICE_ID = "service_695fzu2";
  //const EMAILJS_TEMPLATE_ID = "template_kiuiz2i";
  //const EMAILJS_PUBLIC_KEY = "dipoe1R5anehKFa0J";


  // === Load Saved Contact Info on Mount ===
  useEffect(() => {
    // Retrieve previously entered contact info from localStorage
    const saved = localStorage.getItem("fw_contact");
    if (saved) {
      try {
        const c = JSON.parse(saved);
        // Pre-fill form fields if saved data exists
        setForm((f) => ({
          ...f,
          first_name: c.first_name ?? f.first_name,
          last_name: c.last_name ?? f.last_name,
          email: c.email ?? f.email,
        }));
      } catch {}
    }
  }, []);

  // === Fetch Associates from Database on Mount ===
  useEffect(() => {
    const fetchAssociates = async () => {
      const { data, error } = await supabase
        .from("staffschedules")
        .select("*")
        .eq("is_active", true); // only active associates
      if (!error && data) {
        // store both full and filtered lists (initially same)
        setAssociates(data);
        setFilteredAssociates(data);
      }
    };
    fetchAssociates();
  }, []);

  // === Helper: Map JS date to availability key ===
  const weekdayKeyFromDate = (date) => {
    // Convert JS date to "Mon", "Tue", etc.
    const jsShort = date
      .toLocaleDateString("en-US", { weekday: "short" })
      .slice(0, 3);

    // Map JS weekday to database keys
    const map = {
      Mon: "Mon",
      Tue: "Tue",
      Wed: "Wed",
      Thu: "Thr", // Note: database uses "Thr" for Thursday
      Fri: "Fri",
      Sat: "Sat",
      Sun: "Sun",
    };
    return map[jsShort] ?? jsShort;
  };
  

  // === Helper: Get availability range for associate on a specific date ===
  const getDayRangeForAssociate = (associate, date) => {
    try {
      const raw = associate?.availability;
      // Parse JSON string or use object directly
      const avail = typeof raw === "string" ? JSON.parse(raw) : raw;
      const dayKey = weekdayKeyFromDate(date);
      return avail?.[dayKey]; // returns "off" or "9-5" style string
    } catch (e) {
      console.error("Error parsing availability for associate:", e);
      return undefined;
    }
  };

  // === Helper: Get next three available appointments today ===
const getNextThreeAppointments = () => {
  const today = new Date();

  // Filter associates available today
  const availableToday = associates.filter((a) => {
    const range = getDayRangeForAssociate(a, today);
    return range && String(range).toLowerCase() !== "off";
  });

  if (availableToday.length === 0) return [];

  // For each associate, get their available times today
  const allAppointments = [];
  availableToday.forEach((associate) => {
    const times = generateTimeSlotsFromRange(getDayRangeForAssociate(associate, today));
    times.forEach((time) => {
      // Only include future times
      const [hour, minute] = time.split(":").map(Number);
      const appointmentDateTime = new Date(today);
      appointmentDateTime.setHours(hour, minute, 0, 0);
      if (appointmentDateTime > new Date()) {
        allAppointments.push({ associate, time, datetime: appointmentDateTime });
      }
    });
  });

  // Sort by datetime ascending
  allAppointments.sort((a, b) => a.datetime - b.datetime);

  // Return next three
  return allAppointments.slice(0, 3);
};


  // === Helper: Convert "9-5" style string to numeric 24h start/end ===
  const parseRangeTo24 = (range) => {
    if (!range || typeof range !== "string") return null;
    const parts = range.split("-").map((p) => p.trim());
    if (parts.length !== 2) return null;

    let start = parseInt(parts[0], 10);
    let end = parseInt(parts[1], 10);

    if (Number.isNaN(start) || Number.isNaN(end)) return null;

    // Adjust for PM if end <= start
    if (end <= start) end = end + 12;

    // Clamp start/end to valid hours
    if (start < 0) start = 0;
    if (end > 23) end = 23;

    return { start, end };
  };

  // Converts "HH:MM" in 24-hour format to "h:MM AM/PM"
const formatToAmPm = (time24) => {
  if (!time24) return "";
  const [hourStr, minuteStr] = time24.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
};


  // === Helper: Generate array of hourly time slots from range ===
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

  // === Effect: Filter associates based on selected date ===
  useEffect(() => {
    if (!associates || associates.length === 0) {
      setFilteredAssociates([]);
      return;
    }

    // Keep only associates not "off" on selected date
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

  // === Effect: Generate available times when associate or date changes ===
  useEffect(() => {
    if (!form.associate) {
      setAvailableTimes([]);
      return;
    }

    const range = getDayRangeForAssociate(form.associate, selectedDate);
    const times = generateTimeSlotsFromRange(range);
    setAvailableTimes(times);

    // Clear currently selected time if it's no longer valid
    if (form.time && !times.includes(form.time)) {
      setForm((f) => ({ ...f, time: "" }));
    }
  }, [form.associate, selectedDate]);

  // === Form field change handler ===
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // === Service selection toggle ===
  const toggleService = (service) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  // === Navigate to next step with validation ===
  const nextStep = () => {
    setError("");
    if (step === 4) {
      if (!form.first_name || !form.last_name || !form.email || !form.phone) {
        setError("Please fill out all contact fields before proceeding.");
        return;
      }

         // === Validate Email & Phone ===
    const phoneRegex = /^\d{10}$/; // 10-digit numbers
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

  // === Navigate to previous step ===
  const prevStep = () => {
    setError("");
    setStep((s) => s - 1);
  };

  // === Quick Book Handler ===
const handleQuickBook = () => {
  const nextAppointments = getNextThreeAppointments();

  if (nextAppointments.length === 0) {
    setStatus({ message: "No available appointments today.", type: "error" });
    return;
  }

  // Take the first available appointment
  const firstAppt = nextAppointments[0];

  setSelectedDate(new Date());
  setForm((f) => ({
    ...f,
    date: new Date().toISOString().split("T")[0],
    time: firstAppt.time,
    associate: firstAppt.associate,
  }));

  setStep(4); // Skip to contact info
};


  // === Handle form submission to Supabase ===
  const handleSubmit = async () => {
    // Validate required fields
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

      // Upsert customer record by phone number
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
  <div className="space-y-6 text-center">
    <h3 className="text-lg font-semibold">Welcome! How would you like to book?</h3>

    {/* Quick Book Buttons for next 3 appointments */}
    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-4">
      {getNextThreeAppointments().map((appt, idx) => (
  <button
    key={idx}
    onClick={() => {
      setSelectedDate(new Date());
      setForm((f) => ({
        ...f,
        date: new Date().toISOString().split("T")[0],
        time: appt.time, // still 24h for DB
        associate: appt.associate,
      }));
      setStep(4);
    }}
    className="border border-primary bg-primary text-white px-4 py-2 rounded shadow transition"
  >
    {formatToAmPm(appt.time)} with {appt.associate.staff_name} {/* Display in AM/PM */}
  </button>
))}

    </div>

    {/* Normal booking button */}
    <div className="flex flex-col sm:flex-row justify-center gap-4">
      <button
        onClick={() => setStep(2)}
        className="px-6 py-3 bg-gray-200 text-gray-800 rounded shadow"
      >
        Book Appointment
      </button>
    </div>
  </div>
)}



      {/* Step 2: Service Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Select Services</h3>
          <div className="flex flex-col gap-2">
            {servicesList.map((service) => (
              <label key={service} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.services.includes(service)}
                  onChange={() => toggleService(service)}
                />
                <span>{service}</span>
              </label>
            ))}
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
                ? "bg-blue-500 text-white border-blue-600"
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
              <label className="block font-semibold text-sm mb-1">
                Select Associate
              </label>
              <select
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
            <label className="block font-semibold text-sm mb-1">First Name</label>
            <input
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-sm mb-1">Last Name</label>
            <input
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-sm mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-sm mb-1">Phone</label>
            <input
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
        <button onClick={nextStep}
    className="border border-primary bg-primary text-white px-4 py-2 rounded shadow transition">
        Next
        </button>
        </div>
      </div>
      )}

      {/* Step 5: Review & Submit */}
      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Review Appointment</h3>
          <ul className="text-gray-700 space-y-1">
            <li><strong>First Name:</strong> {form.first_name}</li>
            <li><strong>Last Name:</strong> {form.last_name}</li>
            <li><strong>Email:</strong> {form.email}</li>
            <li><strong>Phone:</strong> {form.phone}</li>
            <li><strong>Services:</strong> {form.services.join(", ")}</li>
            <li><strong>Date:</strong> {form.date}</li>
            <li><strong>Time:</strong> {formatToAmPm(form.time)}</li>
            <li><strong>Associate:</strong> {form.associate?.staff_name}</li>
          </ul>
          <div className="flex justify-between mt-6">
            <button onClick={prevStep} className="border border-border px-3 py-1.5 text-sm rounded bg-white hover:border-primary transition">Back</button>
            <button onClick={handleSubmit} className="border border-primary bg-primary text-white px-4 py-2 text-sm rounded-[var(--radius)] shadow-[var(--shadow)] transition">Confirm & Submit</button>
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
