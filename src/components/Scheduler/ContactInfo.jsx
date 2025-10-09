import React, { useState } from 'react';

const ContactInfo = ({ contact, updateContact, nextStep }) => {
  const [form, setForm] = useState(contact);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = e => {
    e.preventDefault();
    updateContact(form);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
      <input name="email" placeholder="Email" type="email" value={form.email} onChange={handleChange} required />
      <input name="phone" placeholder="Phone" type="tel" value={form.phone} onChange={handleChange} required />
      <button type="submit">Next</button>
    </form>
  );
};

export default ContactInfo;
