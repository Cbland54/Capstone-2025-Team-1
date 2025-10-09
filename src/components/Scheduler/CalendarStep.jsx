import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const CalendarStep = ({ appointment, updateAppointment, nextStep, prevStep }) => {
  const [staffs, setStaffs] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);

  useEffect(() => {
    const fetchStaffs = async () => {
      const { data } = await supabase.from('staffschedules').select('*').eq('is_active', true);
      setStaffs(data);
    };
    fetchStaffs();
  }, []);

  useEffect(() => {
    if (appointment.staff_schedule_id && appointment.appointment_datetime) {
      const fetchTimes = async () => {
        const staff = staffs.find(s => s.id === appointment.staff_schedule_id);
        if (!staff) return;
        const { data: booked } = await supabase.from('appointments').select('appointment_datetime').eq('staff_schedule_id', appointment.staff_schedule_id);
        const bookedTimes = booked.map(a => a.appointment_datetime);
        const times = staff.availability.filter(t => !bookedTimes.includes(t));
        setAvailableTimes(times);
      };
      fetchTimes();
    }
  }, [appointment.staff_schedule_id, appointment.appointment_datetime, staffs]);

  const handleStaffChange = id => updateAppointment({ ...appointment, staff_schedule_id: id });
  const handleTimeChange = datetime => updateAppointment({ ...appointment, appointment_datetime: datetime });

  return (
    <div className="calendar-step">
      <h3>Select Staff</h3>
      <select value={appointment.staff_schedule_id || ''} onChange={e => handleStaffChange(Number(e.target.value))}>
        <option value="">Select a staff</option>
        {staffs.map(staff => <option key={staff.id} value={staff.id}>{staff.staff_name}</option>)}
      </select>

      <h3>Select Date & Time</h3>
      <input type="datetime-local" value={appointment.appointment_datetime || ''} onChange={e => handleTimeChange(e.target.value)} />

      <h4>Available Times</h4>
      {availableTimes.map(time => (
        <button key={time} onClick={() => handleTimeChange(time)} className={appointment.appointment_datetime === time ? 'selected' : ''}>
          {new Date(time).toLocaleTimeString()}
        </button>
      ))}

      <button onClick={prevStep}>Back</button>
      <button onClick={nextStep} disabled={!appointment.staff_schedule_id || !appointment.appointment_datetime}>Next</button>
    </div>
  );
};

export default CalendarStep;
