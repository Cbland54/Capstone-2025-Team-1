import React, { useState } from 'react';
import ContactInfo from './ContactInfo';
import ServiceSelection from './ServiceSelection';
import CalendarStep from './CalendarStep';
import ReviewSubmit from './ReviewSubmit';

const Scheduler = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    contact: { name: '', email: '', phone: '' },
    services: [],
    appointment: { staff_schedule_id: null, appointment_datetime: '', location: '', duration_minutes: 30, notes: '' }
  });

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const updateFormData = (section, data) => {
    setFormData(prev => ({ ...prev, [section]: data }));
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return <ContactInfo contact={formData.contact} updateContact={data => updateFormData('contact', data)} nextStep={nextStep} />;
      case 2:
        return <ServiceSelection services={formData.services} updateServices={data => updateFormData('services', data)} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <CalendarStep appointment={formData.appointment} updateAppointment={data => updateFormData('appointment', data)} nextStep={nextStep} prevStep={prevStep} />;
      case 4:
        return <ReviewSubmit formData={formData} prevStep={prevStep} />;
      default:
        return <div>Unknown step</div>;
    }
  };

  return <div className="scheduler">{renderStep()}</div>;
};

export default Scheduler;
