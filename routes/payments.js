const express = require('express');
const router = express.Router();
const paypal = require('@paypal/checkout-server-sdk');

// PayPal environment setup
function environment() {
  let clientId = process.env.PAYPAL_CLIENT_ID;
  let clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  return process.env.NODE_ENV === 'production' 
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

// PayPal client
function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

// Create payment order
router.post('/create-order', async (req, res) => {
  const { amount, currency = 'USD', clientId, projectId, description } = req.body;
  
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: currency,
        value: amount
      },
      description: description || 'Pro Video Services - Video Production',
      custom_id: `client_${clientId}_project_${projectId}`,
      soft_descriptor: 'Pro Video Svc'
    }],
    application_context: {
      return_url: `${process.env.FRONTEND_URL}/payment/success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      brand_name: 'Pro Video Services',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW'
    }
  });

  try {
    const order = await client().execute(request);
    
    // Store payment intent in your system
    const paymentRecord = {
      id: Date.now().toString(),
      paypalOrderId: order.result.id,
      clientId,
      projectId,
      amount: parseFloat(amount),
      currency,
      status: 'pending',
      createdAt: new Date()
    };
    
    // You'd save this to your database
    console.log('Payment created:', paymentRecord);
    
    res.json({
      success: true,
      orderId: order.result.id,
      approvalUrl: order.result.links.find(link => link.rel === 'approve').href
    });
    
  } catch (error) {
    console.error('PayPal order creation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Payment creation failed',
      error: error.message
    });
  }
});

// Capture payment after approval
router.post('/capture-order', async (req, res) => {
  const { orderId, clientId, projectId } = req.body;
  
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});
  
  try {
    const capture = await client().execute(request);
    
    if (capture.result.status === 'COMPLETED') {
      // Update payment record
      const paymentRecord = {
        paypalOrderId: orderId,
        transactionId: capture.result.purchase_units[0].payments.captures[0].id,
        status: 'completed',
        paidAt: new Date(),
        amount: parseFloat(capture.result.purchase_units[0].payments.captures[0].amount.value),
        payerEmail: capture.result.payer.email_address,
        payerName: `${capture.result.payer.name.given_name} ${capture.result.payer.name.surname}`
      };
      
      console.log('Payment completed:', paymentRecord);
      
      // Now you can trigger video generation since payment is received
      res.json({
        success: true,
        message: 'Payment completed successfully',
        transactionId: paymentRecord.transactionId,
        readyForProduction: true
      });
      
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not completed',
        status: capture.result.status
      });
    }
    
  } catch (error) {
    console.error('PayPal capture failed:', error);
    res.status(500).json({
      success: false,
      message: 'Payment capture failed',
      error: error.message
    });
  }
});

// Get payment status
router.get('/status/:orderId', async (req, res) => {
  const { orderId } = req.params;
  
  const request = new paypal.orders.OrdersGetRequest(orderId);
  
  try {
    const order = await client().execute(request);
    
    res.json({
      success: true,
      status: order.result.status,
      amount: order.result.purchase_units[0].amount.value,
      currency: order.result.purchase_units[0].amount.currency_code
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Status check failed',
      error: error.message
    });
  }
});

// Webhook handler for PayPal notifications
router.post('/webhook', async (req, res) => {
  const event = req.body;
  
  console.log('PayPal webhook received:', event.event_type);
  
  switch (event.event_type) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      // Handle successful payment
      const customId = event.resource.custom_id;
      console.log('Payment completed for:', customId);
      break;
      
    case 'PAYMENT.CAPTURE.DENIED':
      // Handle failed payment
      console.log('Payment denied:', event.resource.id);
      break;
  }
  
  res.status(200).send('OK');
});

// Create pricing tiers for your services
const pricingTiers = {
  basic: {
    name: 'Basic Video',
    price: 50,
    features: [
      'Up to 30 seconds',
      'AI-generated video',
      'Basic style options',
      '1 revision included'
    ]
  },
  standard: {
    name: 'Standard Video',
    price: 100,
    features: [
      'Up to 60 seconds',
      'Premium AI generation',
      'Custom style options',
      '2 revisions included',
      'Music integration'
    ]
  },
  premium: {
    name: 'Premium Video',
    price: 200,
    features: [
      'Up to 2 minutes',
      'High-end AI generation',
      'Fully custom prompts',
      'Unlimited revisions',
      'Music and voice-over',
      'Priority support'
    ]
  }
};

// Get pricing information
router.get('/pricing', (req, res) => {
  res.json({
    success: true,
    tiers: pricingTiers
  });
});

module.exports = router;
