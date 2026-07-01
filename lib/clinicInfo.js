// Central place to edit the clinic facts the chatbot is allowed to state.
// Keeping this separate from the prompt-building logic makes it easy for
// non-developers to update hours, services, or contact details later.

module.exports = {
  name: 'Willow & Bloom Family Clinic',
  address: '12 Clifton Boulevard, Karachi, Sindh 75600',
  phone: '(555) 010-2345',
  email: 'hello@willowbloomclinic.com',
  hours: 'Monday–Friday 9:00 AM–8:00 PM, Saturday 10:00 AM–5:00 PM, closed Sunday',
  bookingUrl: '/contact.html',
  services: [
    'Family Medicine — annual physicals, chronic condition management, vaccinations, same-day sick visits',
    "Pediatrics — well-child visits, growth tracking, vaccination schedules",
    "Women's Health — prenatal checkups, wellness exams, family planning counseling",
    'Cardiology — ECGs, blood pressure and cholesterol management, heart-risk screening',
    'Dermatology — acne, eczema, rash treatment, mole and skin-cancer screening',
    'Diagnostics & Labs — on-site blood draws, rapid testing, imaging referrals (24-hour results)'
  ],
  insuranceNote: 'We work with most major insurance providers in Pakistan. For a specific plan, patients should call the front desk to confirm coverage, since plan details can change.',
  emergencyNote: 'This clinic does not handle emergencies. In a medical emergency, call 911 or go to the nearest emergency room immediately.'
};
