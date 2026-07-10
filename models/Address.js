const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // Ensure userId is required
    address: { type: String, required: true }, // Ensure address is required
    city: { type: String, required: true }, // Ensure city is required
    pincode: { type: String, required: true }, // Ensure pincode is required
    phone: { type: String, required: true }, // Ensure phone is required
    notes: { type: String, required: true }, // Ensure notes is required
    addressType: { 
      type: String, 
      enum: ["billing", "shipping"], // Restrict to billing or shipping
      required: true // Ensure addressType is required
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", AddressSchema);