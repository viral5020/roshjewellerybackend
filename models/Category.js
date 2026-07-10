const mongoose = require("mongoose");

let Category;

try {
  // Try to get the existing model
  Category = mongoose.model("Category");
} catch {
  // If model doesn't exist, create it
  const CategorySchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    sizeChartImage: {
      type: String,
      default: "",
    },
  }, { timestamps: true });
  
  Category = mongoose.model("Category", CategorySchema);
}

module.exports = Category;

