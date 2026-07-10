const express = require('express');
const router = express.Router();
const GiftCard = require('../../models/Giftcard');
const mongoose = require('mongoose');
const Order = require('../../models/Order');

// Validate and apply coupon
router.post('/validate', async (req, res) => {
  try {
    const { code, userId, email, totalAmount, paymentMethod, cartItems } = req.body;
    console.log('Validating coupon:', { code, userId, email, totalAmount, paymentMethod });

    if (!code || !totalAmount || !paymentMethod || !cartItems) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for coupon validation'
      });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Find the gift card with populated category and product
    const giftCard = await GiftCard.findOne({ 
      code,
      status: 'active',
      expiryDate: { $gt: new Date() },
      $expr: { $lt: ["$currentUsageCount", "$maxUsageLimit"] }
    }).populate('category', 'name')
      .populate('product', 'title')
      .populate('userId', 'name email');

    console.log('Found gift card:', giftCard ? {
      code: giftCard.code,
      status: giftCard.status,
      usedEmails: giftCard.usedEmails,
      currentUsageCount: giftCard.currentUsageCount
    } : 'Not found');

    if (!giftCard) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired coupon code'
      });
    }

    // Check if gift card is active
    if (giftCard.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This coupon is no longer active'
      });
    }

    // Check expiry date
    if (new Date(giftCard.expiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This coupon has expired'
      });
    }

    // Check if first order only and user has previous orders
    if (giftCard.isFirstOrderOnly) {
      const previousOrders = await Order.find({ 
        ...(userId ? { userId } : { 'shippingAddress.email': email.toLowerCase() })
      });
      if (previousOrders.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'This coupon is only valid for first-time orders'
        });
      }
    }

    // Check if user specific
    if (giftCard.isUserSpecific && (!userId || giftCard.userId?._id.toString() !== userId)) {
      return res.status(400).json({
        success: false,
        message: 'This coupon is not valid for your account'
      });
    }

    // Check if email has already used this coupon (for guest users)
    if (!userId && email && giftCard.usedEmails?.includes(email.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'This email has already used this coupon'
      });
    }

    // Check payment method eligibility
    if (giftCard.eligiblePaymentMethods && giftCard.eligiblePaymentMethods.length > 0) {
      const validPaymentMethods = {
        'razorpay': ['razorpay', 'online'],
        'cod': ['cod', 'cash_on_delivery']
      };

      const isValidPaymentMethod = giftCard.eligiblePaymentMethods.some(method => {
        const validMethods = validPaymentMethods[method] || [method];
        return validMethods.includes(paymentMethod.toLowerCase());
      });

      if (!isValidPaymentMethod) {
        return res.status(400).json({
          success: false,
          message: `This coupon is only valid for ${giftCard.eligiblePaymentMethods.map(m => 
            m === 'razorpay' ? 'Razorpay' : 'Cash on Delivery'
          ).join(' or ')}`
        });
      }
    }

    // Check category restriction
    if (giftCard.category && cartItems) {
      const eligibleItems = cartItems.filter(item => 
        item.product && 
        item.product.category && 
        item.product.category.toString() === giftCard.category._id.toString()
      );

      if (eligibleItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: `This coupon is only valid for products in the ${giftCard.category.name} category`
        });
      }

      // Calculate total amount for eligible items only
      const eligibleTotal = eligibleItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );

      // Check minimum purchase amount against eligible items total
      if (eligibleTotal < giftCard.minPurchaseAmount) {
        return res.status(400).json({
          success: false,
          message: `Minimum purchase amount of ₹${giftCard.minPurchaseAmount} required for products in ${giftCard.category.name} category`
        });
      }

      // Calculate discount based on eligible items total
      let discount = 0;
      if (giftCard.paymentMethodDiscount > 0) {
        if (giftCard.paymentMethodDiscountType === 'percentage') {
          discount = (eligibleTotal * giftCard.paymentMethodDiscount) / 100;
        } else {
          discount = giftCard.paymentMethodDiscount;
        }
      }

      // Return success with discount details for eligible items
      return res.status(200).json({
        success: true,
        discount,
        eligibleItems,
        eligibleTotal,
        freeShipping: giftCard.freeShipping,
        message: `Coupon applied successfully to ${giftCard.category.name} category products`,
        couponDetails: {
          code: giftCard.code,
          category: giftCard.category.name,
          paymentMethodDiscount: giftCard.paymentMethodDiscount,
          paymentMethodDiscountType: giftCard.paymentMethodDiscountType,
          eligiblePaymentMethods: giftCard.eligiblePaymentMethods
        }
      });
    }

    // Check product restriction
    if (giftCard.product && cartItems) {
      const eligibleItems = cartItems.filter(item => 
        item.product && 
        item.product._id.toString() === giftCard.product._id.toString()
      );

      if (eligibleItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: `This coupon is only valid for the product: ${giftCard.product.title}`
        });
      }

      // Calculate total amount for eligible items only
      const eligibleTotal = eligibleItems.reduce((sum, item) => 
        sum + (item.price * item.quantity), 0
      );

      // Check minimum purchase amount against eligible items total
      if (eligibleTotal < giftCard.minPurchaseAmount) {
        return res.status(400).json({
          success: false,
          message: `Minimum purchase amount of ₹${giftCard.minPurchaseAmount} required for ${giftCard.product.title}`
        });
      }

      // Calculate discount based on eligible items total
      let discount = 0;
      if (giftCard.paymentMethodDiscount > 0) {
        if (giftCard.paymentMethodDiscountType === 'percentage') {
          discount = (eligibleTotal * giftCard.paymentMethodDiscount) / 100;
        } else {
          discount = giftCard.paymentMethodDiscount;
        }
      }

      // Return success with discount details for eligible items
      return res.status(200).json({
        success: true,
        discount,
        eligibleItems,
        eligibleTotal,
        freeShipping: giftCard.freeShipping,
        message: `Coupon applied successfully to ${giftCard.product.title}`,
        couponDetails: {
          code: giftCard.code,
          product: giftCard.product.title,
          paymentMethodDiscount: giftCard.paymentMethodDiscount,
          paymentMethodDiscountType: giftCard.paymentMethodDiscountType,
          eligiblePaymentMethods: giftCard.eligiblePaymentMethods
        }
      });
    }

    // For general coupons (no category/product restrictions)
    // Check minimum purchase amount
    if (totalAmount < giftCard.minPurchaseAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum purchase amount of ₹${giftCard.minPurchaseAmount} required`
      });
    }

    // Calculate discount for general coupons
    let discount = 0;
    if (giftCard.paymentMethodDiscount > 0) {
      if (giftCard.paymentMethodDiscountType === 'percentage') {
        discount = (totalAmount * giftCard.paymentMethodDiscount) / 100;
      } else {
        discount = giftCard.paymentMethodDiscount;
      }
    }

    // Return success with discount details
    return res.status(200).json({
      success: true,
      discount,
      freeShipping: giftCard.freeShipping,
      message: 'Coupon applied successfully',
      couponDetails: {
        code: giftCard.code,
        paymentMethodDiscount: giftCard.paymentMethodDiscount,
        paymentMethodDiscountType: giftCard.paymentMethodDiscountType,
        eligiblePaymentMethods: giftCard.eligiblePaymentMethods
      }
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating coupon',
      error: error.message
    });
  }
});

// Get available coupons
router.post('/available', async (req, res) => {
  try {
    const { userId, email, totalAmount, cartItems } = req.body;
    console.log('Fetching available coupons:', { userId, email, totalAmount });

    if (!totalAmount || !cartItems) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for fetching available coupons'
      });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Find active coupons
    const activeCoupons = await GiftCard.find({
      status: 'active',
      expiryDate: { $gt: new Date() },
      $expr: { $lt: ["$currentUsageCount", "$maxUsageLimit"] }
    }).populate('category', 'name')
      .populate('product', 'title')
      .populate('userId', 'name email');

    // Filter coupons based on user type and eligibility
    const availableCoupons = activeCoupons.filter(coupon => {
      // Check if coupon is user specific
      if (coupon.isUserSpecific) {
        if (userId && coupon.userId?._id.toString() === userId) {
          return true;
        }
        return false;
      }

      // Check if email has already used this coupon
      if (email && coupon.usedEmails?.includes(email.toLowerCase())) {
        return false;
      }

      // Check if user has already used this coupon
      if (userId && coupon.usedBy?.includes(userId)) {
        return false;
      }

      // Check minimum purchase amount
      if (coupon.minPurchaseAmount && totalAmount < coupon.minPurchaseAmount) {
        return false;
      }

      // Check category restrictions
      if (coupon.category && !cartItems.some(item => 
        item.product?.category === coupon.category._id.toString()
      )) {
        return false;
      }

      // Check product restrictions
      if (coupon.product && !cartItems.some(item => 
        item.productId === coupon.product._id.toString()
      )) {
        return false;
      }

      return true;
    });

    res.status(200).json({
      success: true,
      coupons: availableCoupons.map(coupon => ({
        code: coupon.code,
        description: coupon.description,
        isUserSpecific: coupon.isUserSpecific,
        category: coupon.category?.name,
        product: coupon.product?.title,
        minPurchaseAmount: coupon.minPurchaseAmount,
        paymentMethodDiscount: coupon.paymentMethodDiscount,
        paymentMethodDiscountType: coupon.paymentMethodDiscountType,
        eligiblePaymentMethods: coupon.eligiblePaymentMethods,
        freeShipping: coupon.freeShipping,
        expiryDate: coupon.expiryDate
      }))
    });

  } catch (error) {
    console.error('Error fetching available coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available coupons',
      error: error.message
    });
  }
});

// Store guest email
router.post('/store-guest-email', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Received email to store:', email);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('Invalid email format:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Find active coupons first to verify
    const activeCoupons = await GiftCard.find({
      status: 'active',
      expiryDate: { $gt: new Date() },
      $expr: { $lt: ["$currentUsageCount", "$maxUsageLimit"] }
    });
    console.log('Found active coupons:', activeCoupons.length);

    // Store the email in all active coupons
    const updateResult = await GiftCard.updateMany(
      {
        status: 'active',
        expiryDate: { $gt: new Date() },
        $expr: { $lt: ["$currentUsageCount", "$maxUsageLimit"] }
      },
      {
        $addToSet: { usedEmails: email.toLowerCase() }
      }
    );
    console.log('Update result:', updateResult);

    // Verify the update
    const updatedCoupons = await GiftCard.find({
      status: 'active',
      expiryDate: { $gt: new Date() },
      $expr: { $lt: ["$currentUsageCount", "$maxUsageLimit"] }
    });
    console.log('Updated coupons with emails:', updatedCoupons.map(c => ({
      code: c.code,
      usedEmails: c.usedEmails
    })));

    res.status(200).json({
      success: true,
      message: 'Guest email stored successfully'
    });

  } catch (error) {
    console.error('Error storing guest email:', error);
    res.status(500).json({
      success: false,
      message: 'Error storing guest email',
      error: error.message
    });
  }
});

module.exports = router; 