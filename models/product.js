const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    image: String,
    subImages: [{
      type: String,
      required: false
    }],
    title: String,
    description: String,
    category: String,
    subcategory: String,
    brand: String,
    price: Number,
    salePrice: Number,
    weight: Number,
    totalStock: Number,
    averageReview: Number,
    metalType: String,
    diamondType: String,
    gramWeight: Number,
    diamondCarat: Number,
    colors: [String],
    colorImages: [{
      color: String,
      image: String
    }],
    video: String,
    purity: String,
    labourCost: {
      type: Number,
      default: 0
    },
    diamondPrice: {
      type: Number,
      default: 0
    },
    diamondPerCaratPrice: {
      type: Number,
      default: 0
    },
    diamondColor: String,
    diamondClarity: String,
    isBestSeller: {
      type: Boolean,
      default: false
    },
    isNewArrival: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
