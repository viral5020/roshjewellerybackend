// models/Payment.js

const mongoose = require('mongoose');

// Define the schema for the Payment model
const paymentSchema = new mongoose.Schema(
  {
    orderDate: { type: Date, default: Date.now }, // Order creation date
    payStatus: { type: String }, // Payment status, e.g., 'paid'
    // You can add more fields as required
  },
  { strict: false } // Allow storing dynamic/extra fields
);

// Create and export the Payment model
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = { Payment };
