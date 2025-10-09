import React from 'react';
import { supabase } from './supabaseClient';

const ReviewSubmit = ({ formData, prevStep }) => {
  const handleSubmit = async () => {
    const { data, error } = await supabase.from('appointments').insert([{
      staff_schedule_id: formData.appointment.staff_schedule_id,
      appointment_datetime: formData.appointment.appointment_datetime,
      appointment_status: 'Scheduled',
      location: formData.appointment.location || 'Default Location',
      duration_minutes: formData.appointment.duration_minutes,
      notes: formData.appointment.notes || ''
    }]);
    if (!error) alert('Appointment successfully booked!');
  };

  return (
    <div>
      <h3>Review Appointment</h3>
      <p><strong>Name:</strong> {formData.contact.name}</p>
      <p><strong>Email:</strong> {formData.contact.email}</p>
      <p><strong>Phone:</strong> {formData.contact.phone}</p>
      <p><strong>Services:</strong> {formData.services.join(', ')}</p>
      <p><strong>Staff ID:</strong> {formData.appointment.staff_schedule_id}</p>
      <p><strong>Date & Time:</strong> {formData.appointment.appointment_datetime}</p>

      <button onClick={prevStep}>Back</button>
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default ReviewSubmit;
