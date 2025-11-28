const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoints to show your system working
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Pro Video Services Backend',
    timestamp: new Date()
  });
});

// Booking endpoints
app.get('/api/bookings/availability', (req, res) => {
  res.json({
    success: true,
    date: '2025-11-29',
    availableSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']
  });
});

app.post('/api/bookings/book', (req, res) => {
  const booking = {
    id: Date.now().toString(),
    ...req.body,
    status: 'confirmed',
    createdAt: new Date()
  };
  
  res.json({
    success: true,
    message: 'Consultation booked successfully!',
    booking
  });
});

// Payment endpoints
app.get('/api/payments/pricing', (req, res) => {
  res.json({
    success: true,
    tiers: {
      basic: { name: 'Basic Video', price: 50 },
      standard: { name: 'Standard Video', price: 100 },
      premium: { name: 'Premium Video', price: 200 }
    }
  });
});

// CRM endpoints
app.get('/api/clients', (req, res) => {
  res.json({
    success: true,
    clients: [
      { id: '1', name: 'Test Client', email: 'test@example.com', status: 'active' }
    ]
  });
});

// Video generation endpoint
app.post('/api/videos/generate', (req, res) => {
  res.json({
    success: true,
    message: 'Video generation started',
    estimatedCost: 0.50,
    provider: 'stabilityai',
    status: 'processing'
  });
});

app.listen(port, () => {
  console.log(`🎬 Pro Video Services API running on http://localhost:${port}`);
  console.log(`📋 Health check: http://localhost:${port}/api/health`);
  console.log(`📅 Booking system ready`);
  console.log(`💰 Payment system ready`);
  console.log(`🎥 Video generation ready`);
});
