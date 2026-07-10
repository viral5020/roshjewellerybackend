const mongoose = require("mongoose");

const CustomOrderSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    number: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomOrder", CustomOrderSchema);
