import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "./supabaseClient";

export default function SmartScheduler() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState({ message: "", type: "" });
  const [associates, setAssociates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState(""); // field validation errors

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

  const servicesList = [
    "Running Shoe Fitting",
    "Gait Analysis",
    "Orthotic Consultation",
    "Injury Prevention Advice",
  ];

  useEffect(() => {
    const saved = localStorage.getItem("fw_contact");
    if (saved) {
      try {
        const c = JSON.parse(saved);
        setForm((f) => ({
          ...f,
          first_name: c.first_name ?? f.first_name,
          last_name: c.last_name ?? f.last_name,
          email: c.email ?? f.email,
        }));
      } catch {}
    }
  }, []);

  useEffect(() => {
    const fetchAssociates = async () => {
      const { data, error } = await supabase
        .from("staffschedules")
        .select("*")
        .eq("is_active", true);
      if (!error && data) setAssociates(data);
    };
    fetchAssociates();
  }, []);

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
    if (step === 1) {
      if (!form.first_name || !form.last_name || !form.email || !form.phone) {
        setError("Please fill out all contact fields before proceeding.");
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

      // Upsert or find existing customer by email
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
          { onConflict: "email" }
        )
        .select("id")
        .single();
      if (custErr) throw custErr;
      const customerId = cust.id;

      // Find linked shoe selector response (if any)
      let selectorResponseId = localStorage.getItem("fw_selector_response_id");
      if (!selectorResponseId) {
        const { data: resp, error: respFindErr } = await supabase
          .from("shoeselectorresponses")
          .select("id")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (respFindErr) throw respFindErr;
        selectorResponseId = resp?.id ?? null;
      }

      const appointmentDateTime = `${form.date}T${form.time}`;

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

      setStatus({ message: "Appointment booked successfully!", type: "success" });
      setStep(5);
      localStorage.setItem("fw_customer_id", String(customerId));
    } catch (err) {
      console.error("Supabase (scheduler) error:", err);
      setStatus({
        message: err.message ?? "Something went wrong.",
        type: "error",
      });
    }
  };

  return (
    <div className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white border border-border rounded-[var(--radius)] shadow-[var(--shadow)] p-5 text-almostblack text-lg">
      <h2 className="text-center text-2xl font-bold mb-6">
        Book Your Appointment
      </h2>

      {/* Progress Bar */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 mx-1 rounded-full ${
              step >= s ? "bg-primary" : "bg-gray-200"
            }`}
          ></div>
        ))}
      </div>

      {/* Step 1: Contact Info */}
      {step === 1 && (
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

          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex justify-end">
            <button
              onClick={nextStep}
              className="border border-primary bg-primary text-white px-4 py-2 rounded shadow transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Services */}
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

      {/* Step 3: Calendar + Time + Associate */}
      {step === 3 && (
        <div className="flex flex-col md:flex-row gap-6">
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

          <div className="w-full md:w-1/2 bg-white rounded-2xl shadow-md p-4 flex flex-col gap-4">
            <div>
              <label className="block font-semibold text-sm mb-1">
                Select Time
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  "09:00",
                  "10:00",
                  "11:00",
                  "12:00",
                  "13:00",
                  "14:00",
                  "15:00",
                  "16:00",
                  "17:00",
                ].map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, time: t })}
                    className={`p-2 rounded-lg border transition-all duration-150 ${
                      form.time === t
                        ? "bg-blue-500 text-white border-blue-600"
                        : "bg-gray-100 hover:bg-gray-200 border-gray-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-sm mb-1">
                Select Associate
              </label>
              <select
                value={form.associate?.id || ""}
                onChange={(e) => {
                  const selected = associates.find(
                    (a) => a.id === parseInt(e.target.value)
                  );
                  setForm({ ...form, associate: selected });
                }}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="">-- Choose an associate --</option>
                {associates.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.staff_name}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
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

      {/* Step 4: Review & Submit */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Review Appointment</h3>
          <ul className="text-gray-700 space-y-1">
            <li><strong>First Name:</strong> {form.first_name}</li>
            <li><strong>Last Name:</strong> {form.last_name}</li>
            <li><strong>Email:</strong> {form.email}</li>
            <li><strong>Phone:</strong> {form.phone}</li>
            <li><strong>Services:</strong> {form.services.join(", ")}</li>
            <li><strong>Date:</strong> {form.date}</li>
            <li><strong>Time:</strong> {form.time}</li>
            <li><strong>Associate:</strong> {form.associate?.staff_name}</li>
          </ul>
          <div className="flex justify-between mt-6">
            <button onClick={prevStep} className="border border-border px-3 py-1.5 text-sm rounded bg-white hover:border-primary transition">Back</button>
            <button onClick={handleSubmit} className="border border-primary bg-primary text-white px-4 py-2 text-sm rounded-[var(--radius)] shadow-[var(--shadow)] transition">Confirm & Submit</button>
          </div>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 5 && (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-green-600 mb-2">
            Appointment Confirmed!
          </h3>
          <p>Your appointment with {form.associate?.staff_name} has been booked.</p>
        </div>
      )}

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
