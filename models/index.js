const mongoose = require('mongoose');

// Define schemas
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
  },
  { timestamps: true }
);

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
}, { timestamps: true });

// Create models only if they don't exist
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

module.exports = {
  Product,
  Category
}; 