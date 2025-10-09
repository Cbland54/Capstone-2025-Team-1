import React, { useState } from 'react';

const ServiceSelection = ({ services, updateServices, nextStep, prevStep }) => {
  const availableServices = ['Fitting', 'Consultation', 'Other'];
  const [selected, setSelected] = useState(services);

  const toggleService = service => {
    setSelected(prev => prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]);
  };

  const handleNext = () => {
    updateServices(selected);
    nextStep();
  };

  return (
    <div>
      <h3>Select Services</h3>
      {availableServices.map(service => (
        <div key={service}>
          <input type="checkbox" id={service} checked={selected.includes(service)} onChange={() => toggleService(service)} />
          <label htmlFor={service}>{service}</label>
        </div>
      ))}
      <button onClick={prevStep}>Back</button>
      <button onClick={handleNext}>Next</button>
    </div>
  );
};

export default ServiceSelection;
