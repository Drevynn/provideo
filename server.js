const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple storage
let bookings = [];
let clients = [];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Pro Video Services Backend',
    timestamp: new Date()
  });
});

// Booking endpoints
app.get('/api/bookings/availability', (req, res) => {
  const { date } = req.query;
  res.json({
    success: true,
    date: date || '2025-11-29',
    availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
  });
});

app.post('/api/bookings/book', (req, res) => {
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
  
  // Auto-create client
  const client = {
    id: Date.now().toString() + '_client',
    name,
    email,
    phone,
    company,
    status: 'lead',
    source: 'website_booking',
    bookingId: booking.id,
    createdAt: new Date()
  };
  
  clients.push(client);
  
  console.log('New booking:', booking);
  console.log('New client created:', client);
  
  res.json({
    success: true,
    message: 'Consultation booked successfully!',
    booking: {
      id: booking.id,
      date: booking.date,
      time: booking.time,
      confirmationMessage: `Hi ${name}! Your consultation is confirmed for ${date} at ${time}. We'll discuss your ${projectType || 'video'} project and how Pro Video Services can help!`
    }
  });
});

// Get all bookings
app.get('/api/bookings', (req, res) => {
  res.json({
    success: true,
    bookings: bookings.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
  });
});

// Client management
app.get('/api/clients', (req, res) => {
  res.json({
    success: true,
    clients: clients.map(client => ({
      ...client,
      totalBookings: bookings.filter(b => b.email === client.email).length
    }))
  });
});

// Pricing info
app.get('/api/pricing', (req, res) => {
  res.json({
    success: true,
    tiers: {
      basic: {
        name: 'Basic Video',
        price: 297,
        duration: 30,
        features: ['AI-generated video', 'Professional editing', '1 revision', 'HD export']
      },
      standard: {
        name: 'Standard Video',
        price: 597,
        duration: 60,
        features: ['Premium AI generation', 'Custom styles', '2 revisions', 'Music integration', 'Priority support']
      },
      premium: {
        name: 'Premium Video',
        price: 1297,
        duration: 120,
        features: ['High-end AI generation', 'Unlimited revisions', 'Voice-over', '24/7 support', 'Rush delivery']
      }
    }
  });
});

// Campaign upsells
app.get('/api/campaigns/pricing', (req, res) => {
  res.json({
    success: true,
    campaigns: {
      email: { name: 'Email Sequence', price: 497, description: '5-email series with your video' },
      landing: { name: 'Landing Page', price: 797, description: 'High-converting page with video' },
      social: { name: 'Social Media Ads', price: 997, description: 'Facebook & Instagram campaigns' },
      complete: { name: 'Complete Package', price: 2497, description: 'Email + Landing Page + Social Ads' }
    }
  });
});

// Simple video generation endpoint (no external APIs)
app.post('/api/videos/quote', (req, res) => {
  const { prompt, duration, style, tier } = req.body;
  
  const pricing = {
    basic: 297,
    standard: 597,
    premium: 1297
  };
  
  res.json({
    success: true,
    quote: {
      prompt: prompt || 'Custom video',
      duration: duration || 30,
      style: style || 'cinematic',
      tier: tier || 'standard',
      price: pricing[tier] || 597,
      deliveryTime: tier === 'premium' ? '2-3 business days' : '3-5 business days'
    },
    nextStep: 'Book consultation to discuss your project'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

app.listen(port, () => {
  console.log(`🎬 Pro Video Services API running on port ${port}`);
  console.log(`📋 Health check: /api/health`);
  console.log(`📅 Booking system ready`);
  console.log(`👥 Client management ready`);
});

module.exports = app;
