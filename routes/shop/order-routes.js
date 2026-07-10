const express = require("express");

const {
  createOrder,
  getAllOrdersByUser,
  getOrderDetails,
  capturePayment,
  checkStockAvailability,
} = require("../../controllers/shop/order-controller");

const router = express.Router();

// Add detailed logging middleware
router.use((req, res, next) => {
  try {
    console.log('Order route accessed:', {
      method: req.method,
      path: req.path,
      url: req.url,
      headers: req.headers,
      body: JSON.stringify(req.body, null, 2),
      query: req.query,
      params: req.params
    });
    next();
  } catch (error) {
    console.error('Error in order route logging:', error);
    next(error);
  }
});

// Add validation middleware for create order
const validateCreateOrder = (req, res, next) => {
  try {
    console.log('Validating order data:', JSON.stringify(req.body, null, 2));
    
    const isGuestOrder = req.body.isGuestOrder === true;
    const requiredFields = ['cartItems', 'shippingAddress', 'billingAddress', 'paymentMethod', 'totalAmount'];
    
    // Add userId to required fields only if not a guest order
    if (!isGuestOrder) {
      requiredFields.push('userId');
    }
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    if (!Array.isArray(req.body.cartItems) || req.body.cartItems.length === 0) {
      console.error('Invalid cart items:', req.body.cartItems);
      return res.status(400).json({
        success: false,
        message: 'Cart items must be a non-empty array'
      });
    }

    // Validate cart items structure
    const invalidItems = req.body.cartItems.filter(item => 
      !item.productId || !item.title || !item.price || !item.quantity
    );

    if (invalidItems.length > 0) {
      console.error('Invalid cart items structure:', invalidItems);
      return res.status(400).json({
        success: false,
        message: 'Invalid cart items structure. Each item must have productId, title, price, and quantity'
      });
    }

    // Validate addresses
    const addressFields = ['address', 'city', 'pincode', 'phone'];
    const invalidShippingAddress = addressFields.filter(field => !req.body.shippingAddress[field]);
    const invalidBillingAddress = addressFields.filter(field => !req.body.billingAddress[field]);

    if (invalidShippingAddress.length > 0) {
      console.error('Invalid shipping address:', invalidShippingAddress);
      return res.status(400).json({
        success: false,
        message: `Invalid shipping address. Missing fields: ${invalidShippingAddress.join(', ')}`
      });
    }

    if (invalidBillingAddress.length > 0) {
      console.error('Invalid billing address:', invalidBillingAddress);
      return res.status(400).json({
        success: false,
        message: `Invalid billing address. Missing fields: ${invalidBillingAddress.join(', ')}`
      });
    }

    // For guest orders, validate email and name in addresses
    if (isGuestOrder) {
      if (!req.body.shippingAddress.email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required in shipping address for guest orders'
        });
      }
      if (!req.body.shippingAddress.name) {
        return res.status(400).json({
          success: false,
          message: 'Name is required in shipping address for guest orders'
        });
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.shippingAddress.email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format in shipping address'
        });
      }
    }

    // Validate total amount
    if (isNaN(req.body.totalAmount) || req.body.totalAmount <= 0) {
      console.error('Invalid total amount:', req.body.totalAmount);
      return res.status(400).json({
        success: false,
        message: 'Total amount must be a positive number'
      });
    }

    // Validate payment method
    const validPaymentMethods = ['cod', 'razorpay', 'paypal'];
    if (!validPaymentMethods.includes(req.body.paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    console.log('Order validation passed');
    next();
  } catch (error) {
    console.error('Error in create order validation:', error);
    next(error);
  }
};

// Wrap route handlers with error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post("/create", validateCreateOrder, asyncHandler(createOrder));
router.post("/capture", asyncHandler(capturePayment));
router.post("/check-stock", asyncHandler(checkStockAvailability));
router.get("/list/:userId", asyncHandler(getAllOrdersByUser));
router.get("/details/:id", asyncHandler(getOrderDetails));
router.get("/:id", asyncHandler(getOrderDetails));

// Add error handling middleware for this router
router.use((err, req, res, next) => {
  console.error('Order route error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  res.status(500).json({
    success: false,
    message: "Error processing order request",
    error: err.message
  });
});

module.exports = router;
