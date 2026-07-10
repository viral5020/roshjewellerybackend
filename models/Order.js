const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: function() {
      return !this.isGuestOrder; // Only required if not a guest order
    }
  },
  isGuestOrder: {
    type: Boolean,
    default: false
  },
  cartId: {
    type: String,
    required: false
  },
  cartItems: [{
    productId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: false
    },
    price: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    size: {
      type: String,
      required: false
    }
  }],
  shippingAddress: {
    addressId: String,
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    notes: String,
    email: String // Add email field for guest orders
  },
  billingAddress: {
    addressId: String,
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    notes: String,
    email: String // Add email field for guest orders
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCharges: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWithShipping: {
    type: Number,
    required: true,
    min: 0
  },
  weight: {
    type: Number,
    default: 0,
    min: 0
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  orderUpdateDate: {
    type: Date,
    default: Date.now
  },
  paymentId: String,
  payerId: String,
  couponCode: String,
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  freeShipping: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
OrderSchema.index({ userId: 1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ orderDate: -1 });

module.exports = mongoose.model("Order", OrderSchema);
