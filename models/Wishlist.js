const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  image: { type: String },
  title: { type: String },
  description: { type: String },
  category: { type: String },
  brand: { type: String },
  price: { type: Number },
  salePrice: { type: Number },
  weight: { type: Number },
  totalStock: { type: Number },
  averageReview: { type: Number },
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
