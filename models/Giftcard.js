const mongoose = require('mongoose');

// GiftCard Schema
const giftCardSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true, // This creates an index
    },
    description: {
      type: String,
      default: '',
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    maxUsageLimit: {
      type: Number,
      default: 1, // Default to single use
      min: 1,
    },
    currentUsageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    usedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    usedEmails: {
      type: [String],
      default: [],
      trim: true,
      lowercase: true
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: false,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false,
    },
    // New fields
    isUserSpecific: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isFirstOrderOnly: {
      type: Boolean,
      default: false,
    },
    paymentMethodDiscount: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function(value) {
          // If it's a percentage discount, limit to 100%
          if (this.paymentMethodDiscountType === 'percentage') {
            return value <= 100;
          }
          // For fixed amount, no upper limit but must be positive
          return value > 0;
        },
        message: props => {
          if (props.value > 100 && this.paymentMethodDiscountType === 'percentage') {
            return 'Percentage discount cannot exceed 100%';
          }
          return 'Discount amount must be greater than 0';
        }
      }
    },
    paymentMethodDiscountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    eligiblePaymentMethods: [{
      type: String,
      enum: ['razorpay', 'cod'],
    }],
    freeShipping: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields
  }
);

// GiftCard Model
const GiftCard = mongoose.model('GiftCard', giftCardSchema);

// Drop any existing indexes that might cause conflicts
GiftCard.collection.dropIndexes().catch(err => {
  console.log('No indexes to drop or error dropping indexes:', err);
});

module.exports = GiftCard;
