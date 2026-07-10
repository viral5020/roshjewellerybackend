// models/Transaction.js
const mongoose = require('mongoose');

const transactionRowSchema = new mongoose.Schema({
  asset: String,
  sector: String,
  qty: Number,
  price: Number,
  brokerage: Number,
  amount: Number,
});

const transactionSchema = new mongoose.Schema({
  purchases: [transactionRowSchema],
  sales: [transactionRowSchema],
  charges: {
    stt: Number,
    stamp: Number,
    other: Number,
    total: Number,
  },
  meta: {
    date: String,
    broker: String,
    contractNote: String,
    settlement: String,
    autoTransfer: Boolean,
  },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
