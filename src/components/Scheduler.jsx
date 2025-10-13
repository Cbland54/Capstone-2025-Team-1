import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

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

  // Fetch associates from Supabase on load
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleService = (service) => {
    setForm((prev) => {
      const selected = prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service];
      return { ...prev, services: selected };
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone || !form.date || !form.time || !form.associate) {
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

  return (
    <div className="max-w-lg mx-auto bg-white shadow-lg rounded-2xl p-6 mt-8">
      <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
        Book Your Appointment
      </h2>

      {/* Step indicators */}
      <div className="flex justify-between mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 mx-1 rounded-full ${
              step >= s ? "bg-blue-600" : "bg-gray-300"
            }`}
          ></div>
        ))}
      </div>

      {/* Step 1: Contact Info */}
      {step === 1 && (
        <div>
          <label className="block mb-2 font-semibold">Full Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-3"
            required
          />
          <label className="block mb-2 font-semibold">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-3"
            required
          />
          <label className="block mb-2 font-semibold">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-4"
            required
          />
          <button
            onClick={nextStep}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            Next
          </button>
        </div>
      )}

      {/* Step 2: Select Services */}
      {step === 2 && (
        <div>
          <h3 className="font-semibold mb-2">Select Desired Services</h3>
          <div className="flex flex-col gap-2 mb-4">
            {servicesList.map((service) => (
              <label key={service} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.services.includes(service)}
                  onChange={() => toggleService(service)}
                />
                <span>{service}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Date, Time, and Associate */}
      {step === 3 && (
        <div>
          <label className="block mb-2 font-semibold">Preferred Date</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-3"
            required
          />
          <label className="block mb-2 font-semibold">Preferred Time</label>
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-3"
            required
          />

          <label className="block mb-2 font-semibold">Select Associate</label>
          <select
            name="associate"
            value={form.associate}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-4"
            required
          >
            <option value="">-- Choose an associate --</option>
            {associates.map((a) => (
              <option key={a.id} value={a.name}>
                {a.name} {a.specialties ? `– ${a.specialties}` : ""}
              </option>
            ))}
          </select>

          <div className="flex justify-between">
            <button
              onClick={prevStep}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Submit */}
      {step === 4 && (
        <div>
          <h3 className="font-semibold mb-3">Review Your Appointment</h3>
          <ul className="mb-4 text-gray-700">
            <li><strong>Name:</strong> {form.name}</li>
            <li><strong>Email:</strong> {form.email}</li>
            <li><strong>Phone:</strong> {form.phone}</li>
            <li><strong>Services:</strong> {form.services.join(", ") || "None selected"}</li>
            <li><strong>Date:</strong> {form.date}</li>
            <li><strong>Time:</strong> {form.time}</li>
            <li><strong>Associate:</strong> {form.associate}</li>
          </ul>

          <div className="flex justify-between">
            <button
              onClick={prevStep}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
            >
              Confirm & Submit
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 5 && (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-green-600 mb-3">
            Appointment Confirmed!
          </h3>
          <p className="text-gray-700">
            Thank you, {form.name}. Your appointment has been booked with {form.associate}.
          </p>
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
