// controllers/payment.js

const { Payment } = require('../../models/payment');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET 
});

// Create Razorpay Order
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount, // amount in smallest currency unit (paise for INR)
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating Razorpay order',
      error: error.message 
    });
  }
};

// Verify Payment Function
const verify = async (req, res) => {
  const {
    orderId,
    paymentId,
    signature,
    amount,
    orderItems,
    userId,
    userShipping,
  } = req.body;

  try {
    // Verify the payment signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + "|" + paymentId)
      .digest('hex');

    if (generated_signature === signature) {
      // Payment is successful
      let orderConfirm = await Payment.create({
        orderId,
        paymentId,
        signature,
        amount,
        orderItems,
        userId,
        userShipping,
        payStatus: 'paid',
      });

      res.json({ message: 'Payment successful', success: true, orderConfirm });
    } else {
      res.status(400).json({ message: 'Invalid signature', success: false });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Error verifying payment', success: false });
  }
};

// Fetch user orders function
const userOrder = async (req, res) => {
  const userId = req.user._id.toString(); 
  
  try {
    const orders = await Payment.find({ userId }).sort({ orderDate: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Error fetching user orders', success: false });
  }
};

// Exporting the functions
module.exports = {
  verify,
  createRazorpayOrder,
  userOrder
};
