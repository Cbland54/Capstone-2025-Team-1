import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function SmartScheduler() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState({ message: "", type: "" });
  const [associates, setAssociates] = useState([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    services: [],
    date: "",
    time: "",
    associate: "",
  });

  const servicesList = [
    "Running Shoe Fitting",
    "Gait Analysis",
    "Orthotic Consultation",
    "Injury Prevention Advice",
  ];

  useEffect(() => {
    const fetchAssociates = async () => {
      const { data, error } = await supabase
        .from("associates")
        .select("*")
        .eq("available", true);
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

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.date ||
      !form.time ||
      !form.associate
    ) {
      setStatus({ message: "Please fill out all required fields.", type: "error" });
      return;
    }

    try {
      const { error } = await supabase.from("appointments").insert([
        {
          name: form.name,
          email: form.email,
          phone: form.phone,
          services: form.services.join(", "),
          date: form.date,
          time: form.time,
          associate: form.associate,
        },
      ]);

      if (error) throw error;
      setStatus({ message: "Appointment booked successfully!", type: "success" });
      setStep(5);
    } catch (error) {
      setStatus({ message: error.message, type: "error" });
    }
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  // Available times for the time grid
  const availableTimes = [
    "9:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "1:00 PM", "2:00 PM",
    "3:00 PM", "4:00 PM", "5:00 PM"
  ];

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl shadow p-6 mt-10">
      <h2 className="text-center text-2xl font-bold mb-6">Book Your Appointment</h2>

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
            <label className="block font-semibold text-sm mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none"
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
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none"
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
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>
          <div className="flex justify-end">
            <button onClick={nextStep} className="btn-primary">
              Next →
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
          <div className="flex justify-between mt-6">
            <button onClick={prevStep} className="btn-secondary">
              ← Back
            </button>
            <button onClick={nextStep} className="btn-primary">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Visual Calendar and Time Grid */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Calendar */}
            <div className="bg-white rounded-2xl shadow-md p-4 w-full md:w-1/2">
              <h3 className="font-semibold text-lg mb-2">Select a Date</h3>
              <Calendar
                onChange={(date) => setForm({ ...form, date: date.toISOString().split("T")[0] })}
                value={form.date ? new Date(form.date) : new Date()}
                minDate={new Date()}
              />
            </div>

            {/* Time Slots */}
            <div className="bg-white rounded-2xl shadow-md p-4 w-full md:w-1/2">
              <h3 className="font-semibold text-lg mb-2">
                Select a Time {form.date ? `on ${new Date(form.date).toDateString()}` : ""}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => setForm({ ...form, time })}
                    className={`p-2 rounded-lg border transition-all duration-150 ${
                      form.time === time
                        ? "bg-blue-500 text-white border-blue-600"
                        : "bg-gray-100 hover:bg-gray-200 border-gray-300"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Associate Selection */}
          <div>
            <label className="block font-semibold text-sm mb-1">Select Associate</label>
            <select
              name="associate"
              value={form.associate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none"
              required
            >
              <option value="">-- Choose an associate --</option>
              {associates.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name} {a.specialties ? `– ${a.specialties}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <button onClick={prevStep} className="btn-secondary">
              ← Back
            </button>
            <button onClick={nextStep} className="btn-primary">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Submit */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Review Appointment</h3>
          <ul className="text-gray-700 space-y-1">
            <li><strong>Name:</strong> {form.name}</li>
            <li><strong>Email:</strong> {form.email}</li>
            <li><strong>Phone:</strong> {form.phone}</li>
            <li><strong>Services:</strong> {form.services.join(", ")}</li>
            <li><strong>Date:</strong> {form.date}</li>
            <li><strong>Time:</strong> {form.time}</li>
            <li><strong>Associate:</strong> {form.associate}</li>
          </ul>
          <div className="flex justify-between mt-6">
            <button onClick={prevStep} className="btn-secondary">
              ← Back
            </button>
            <button onClick={handleSubmit} className="btn-success">
              Confirm & Submit
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 5 && (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-green-600 mb-2">
            Appointment Confirmed!
          </h3>
          <p>Your appointment with {form.associate} has been booked.</p>
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
