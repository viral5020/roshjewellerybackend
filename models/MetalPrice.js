const mongoose = require("mongoose");

const MetalPriceSchema = new mongoose.Schema(
  {
    goldPrice: {
      type: Number,
      default: 0,
    },
    silverPrice: {
      type: Number,
      default: 0,
    },
    goldPrices: {
      "24K": { type: Number, default: 0 },
      "22K": { type: Number, default: 0 },
      "21K": { type: Number, default: 0 },
      "20K": { type: Number, default: 0 },
      "18K": { type: Number, default: 0 },
      "14K": { type: Number, default: 0 },
      "10K": { type: Number, default: 0 },
      "9K": { type: Number, default: 0 },
    },
    silverPrices: {
      "999": { type: Number, default: 0 },
      "958": { type: Number, default: 0 },
      "950": { type: Number, default: 0 },
      "925": { type: Number, default: 0 },
      "900": { type: Number, default: 0 },
      "835": { type: Number, default: 0 },
      "800": { type: Number, default: 0 },
    },
    diamondPricePerCarat: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MetalPrice", MetalPriceSchema);
