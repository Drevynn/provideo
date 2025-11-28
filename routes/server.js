const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const stripe = require('stripe');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Stripe
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/bookings', require('./routes/bookings'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Pro Video Services Backend' });
});

app.listen(port, () => {
  console.log(`Pro Video Services API running on port ${port}`);
});

module.exports = app;
