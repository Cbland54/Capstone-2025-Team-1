import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "./supabaseClient";

export default function SmartScheduler() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState({ message: "", type: "" });
  const [associates, setAssociates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    services: [],
    date: "", // string version for submission
    time: "",
    associate: null, // store full object
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

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!form.first_name || !form.last_name || !form.email || !form.phone || !form.date || !form.time || !form.associate) {
      setStatus({ message: "Please fill out all required fields.", type: "error" });
      return;
    }

    try {
      // Check if customer exists
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", form.email)
        .single();

      let customerId;
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer } = await supabase
          .from("customers")
          .insert([
            { 
              first_name: form.first_name, 
              last_name: form.last_name, 
              email: form.email, 
              phone_number: form.phone 
            }
          ])
          .select()
          .single();
        customerId = newCustomer.id;
      }

      // Check for shoe selector response
      const { data: shoeResponse } = await supabase
        .from("shoeselectorresponses")
        .select("id")
        .eq("customer_id", customerId)
        .single();

      // Insert appointment
      const { error } = await supabase.from("appointments").insert([
        {
          staff_schedule_id: form.associate.id,
          appointment_datetime: `${form.date}T${form.time}`,
          reminder_sent: false,
          service: form.services.join(", "),
          shoeselectorresponse_id: shoeResponse?.id || null,
          customer_id: customerId,
        },
      ]);

      if (error) throw error;
      setStatus({ message: "Appointment booked successfully!", type: "success" });
      setStep(5);
    } catch (err) {
      setStatus({ message: err.message, type: "error" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6 mt-10">
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
            <label className="block font-semibold text-sm mb-1">First Name</label>
            <input
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none"
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
            <button onClick={nextStep} className="btn-primary">Next →</button>
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
            <button onClick={prevStep} className="btn-secondary">← Back</button>
            <button onClick={nextStep} className="btn-primary">Next →</button>
          </div>
        </div>
      )}

      {/* Step 3: Calendar + Time + Associate */}
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

          {/* Times + Associate */}
          <div className="w-full md:w-1/2 bg-white rounded-2xl shadow-md p-4 flex flex-col gap-4">
            <div>
              <label className="block font-semibold text-sm mb-1">Select Time</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, time: t })}
                    className={`p-2 rounded-lg border transition-all duration-150 ${
                      form.time === t ? "bg-blue-500 text-white border-blue-600" : "bg-gray-100 hover:bg-gray-200 border-gray-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-sm mb-1">Select Associate</label>
              <select
                value={form.associate?.id || ""}
                onChange={(e) => {
                  const selected = associates.find(a => a.id === parseInt(e.target.value));
                  setForm({ ...form, associate: selected });
                }}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="">-- Choose an associate --</option>
                {associates.map((a) => (
                  <option key={a.id} value={a.id}>{a.staff_name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={prevStep} className="btn-secondary">← Back</button>
              <button onClick={nextStep} className="btn-primary">Next →</button>
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
            <button onClick={prevStep} className="btn-secondary">← Back</button>
            <button onClick={handleSubmit} className="btn-success">Confirm & Submit</button>
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
