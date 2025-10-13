import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { supabase } from "./supabaseClient";

export default function SmartScheduler({ customerId, shoeselectorResponseId }) {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState({ message: "", type: "" });
  const [staffList, setStaffList] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([
    "9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"
  ]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    date: "",
    time: "",
    staff_schedule_id: "",
  });

  const servicesList = [
    "Running Shoe Fitting",
    "Gait Analysis",
    "Orthotic Consultation",
    "Injury Prevention Advice",
  ];

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");

  // Fetch staff and available times whenever the date changes
  useEffect(() => {
    if (!form.date) return;

    const fetchStaffAndTimes = async () => {
      const { data: staffData, error: staffError } = await supabase
        .from("staffschedules")
        .select("*")
        .eq("is_active", true);

      if (staffError) return;

      const { data: appointmentsData, error: apptError } = await supabase
        .from("appointments")
        .select("staff_schedule_id, appointment_datetime")
        .gte("appointment_datetime", `${form.date}T00:00:00`)
        .lt("appointment_datetime", `${form.date}T23:59:59`);

      if (apptError) return;

      const bookedTimes = appointmentsData.map(a => {
        const d = new Date(a.appointment_datetime);
        return `${d.getHours()}:${d.getMinutes().toString().padStart(2,"0")}`;
      });

      setStaffList(staffData);
      setAvailableTimes([
        "9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"
      ].filter(t => !bookedTimes.includes(convertTo24Hour(t))));
    };

    fetchStaffAndTimes();
  }, [form.date]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDateChange = (date) => {
    const correctedDate = new Date(date);
    correctedDate.setHours(0,0,0,0);
    setSelectedDate(correctedDate);
    setForm({ ...form, date: correctedDate.toISOString().split("T")[0], staff_schedule_id: "", time: "" });
    setSelectedTime("");
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setForm({ ...form, time });
  };

  const handleStaffSelect = (e) => {
    setForm({ ...form, staff_schedule_id: e.target.value });
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");
    if (hours === "12") hours = "00";
    if (modifier === "PM") hours = parseInt(hours, 10) + 12;
    return `${hours}:${minutes}`;
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone || !form.service || !form.date || !form.time || !form.staff_schedule_id) {
      setStatus({ message: "Please fill all required fields.", type: "error" });
      return;
    }

    const appointmentDatetime = new Date(`${form.date}T${convertTo24Hour(form.time)}:00`);

    try {
      const { error } = await supabase.from("appointments").insert([
        {
          staff_schedule_id: form.staff_schedule_id,
          appointment_datetime: appointmentDatetime.toISOString(),
          service: form.service,
          shoeselectorresponse_id: shoeselectorResponseId,
          customer_id: customerId,
          reminder_sent: false,
        },
      ]);

      if (error) throw error;

      setStatus({ message: "Appointment booked successfully!", type: "success" });
      setStep(5);
    } catch (error) {
      setStatus({ message: error.message, type: "error" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6 mt-10">
      <h2 className="text-center text-2xl font-bold mb-6">Book Your Appointment</h2>

      {/* Progress Bar */}
      <div className="flex justify-between mb-8">
        {[1,2,3,4,5].map(s => (
          <div key={s} className={`flex-1 h-2 mx-1 rounded-full ${step>=s?"bg-primary":"bg-gray-200"}`}></div>
        ))}
      </div>

      {/* Step 1: Customer Info */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block font-semibold text-sm mb-1">Full Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none" required />
          </div>
          <div>
            <label className="block font-semibold text-sm mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none" required />
          </div>
          <div>
            <label className="block font-semibold text-sm mb-1">Phone</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-primary focus:outline-none" required />
          </div>
          <div className="flex justify-end">
            <button onClick={nextStep} className="btn-primary">Next →</button>
          </div>
        </div>
      )}

      {/* Step 2: Service Selection */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Select Service</h3>
          <div className="flex flex-col gap-2">
            {servicesList.map(s => (
              <label key={s} className="flex items-center gap-2">
                <input type="radio" name="service" value={s} checked={form.service===s} onChange={handleChange} />
                <span>{s}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-between mt-6">
            <button onClick={prevStep} className="btn-secondary">← Back</button>
            <button onClick={nextStep} className="btn-primary">Next →</button>
          </div>
        </div>
      )}

      {/* Step 3: Calendar + Time + Staff */}
      {step === 3 && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Calendar */}
          <div className="w-full md:w-1/2 bg-white rounded-2xl shadow p-4">
            <h3 className="font-semibold mb-2">Select a Date</h3>
            <Calendar value={selectedDate} onChange={handleDateChange} minDate={new Date()} />
          </div>

          {/* Times and Staff */}
          <div className="w-full md:w-1/2 flex flex-col gap-4">
            <div>
              <h3 className="font-semibold mb-2">Select Time</h3>
              <div className="grid grid-cols-2 gap-2">
                {availableTimes.map(t => (
                  <button key={t} onClick={() => handleTimeSelect(t)} className={`p-2 rounded-md border ${selectedTime===t?"bg-blue-500 text-white":"bg-gray-100 hover:bg-gray-200"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Select Associate</h3>
              <select value={form.staff_schedule_id} onChange={handleStaffSelect} className="w-full border p-2 rounded-md focus:ring-2 focus:ring-primary">
                <option value="">-- Choose an associate --</option>
                {staffList.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.staff_name} {a.specialties?`– ${a.specialties}`:""}
                  </option>
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
            <li><strong>Name:</strong> {form.name}</li>
            <li><strong>Email:</strong> {form.email}</li>
            <li><strong>Phone:</strong> {form.phone}</li>
            <li><strong>Service:</strong> {form.service}</li>
            <li><strong>Date:</strong> {form.date}</li>
            <li><strong>Time:</strong> {form.time}</li>
            <li><strong>Associate:</strong> {staffList.find(s=>s.id===form.staff_schedule_id)?.staff_name}</li>
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
          <h3 className="text-xl font-semibold text-green-600 mb-2">Appointment Confirmed!</h3>
          <p>Your appointment with {staffList.find(s=>s.id===form.staff_schedule_id)?.staff_name} has been booked.</p>
        </div>
      )}

      {status.message && (
        <p className={`mt-4 text-center font-medium ${status.type==="success"?"text-green-600":"text-red-600"}`}>
          {status.message}
        </p>
      )}
    </div>
  );
}
