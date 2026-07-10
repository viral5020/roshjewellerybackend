const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  description: String,
  quantity: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  amount: { type: Number, default: 0 }
});

const invoiceSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  billingAddress: String,
  shippingAddress: String,
  invoiceNumber: String,
  invoiceDate: Date,
  paymentMethod: String,
  dueDate: Date,
  poNumber: String,
  logo: String,
  items: [itemSchema],
  notes: String,
  terms: String,
  amountPaid: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 }
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
