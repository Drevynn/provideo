const express = require('express');
const router = express.Router();

// Simple booking storage (upgrade to database later)
let bookings = [];

// Your available time slots
const defaultAvailability = {
  monday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  tuesday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  wednesday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  thursday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
  friday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
  saturday: [],
  sunday: []
};

// Get available time slots
router.get('/availability', (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date parameter required'
    });
  }
  
  const requestedDate = new Date(date);
  const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const dateString = requestedDate.toISOString().split('T')[0];
  
  const daySlots = defaultAvailability[dayName] || [];
  const bookedSlots = bookings
    .filter(booking => booking.date === dateString && booking.status !== 'cancelled')
    .map(booking => booking.time);
  
  const availableSlots = daySlots.filter(slot => !bookedSlots.includes(slot));
  
  res.json({
    success: true,
    date: dateString,
    availableSlots
  });
});

// Book consultation
router.post('/book', async (req, res) => {
  const { name, email, phone, company, date, time, projectType, budget, message } = req.body;
  
  if (!name || !email || !date || !time) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, date, and time are required'
    });
  }
  
  const booking = {
    id: Date.now().toString(),
    name,
    email,
    phone,
    company,
    date,
    time,
    projectType,
    budget,
    message,
    status: 'confirmed',
    createdAt: new Date()
  };
  
  bookings.push(booking);
  
  res.json({
    success: true,
    message: 'Booking confirmed!',
    booking
  });
});

// Get all bookings
router.get('/', (req, res) => {
  res.json({
    success: true,
    bookings: bookings.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
  });
});

module.exports = router;
