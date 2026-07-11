const paypal = require("../../helpers/paypal");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/product");
const User = require("../../models/User");
const mongoose = require("mongoose");
const { sendOrderConfirmationEmail } = require("../../emailService");
const GiftCard = require("../../models/Giftcard");
const transporter = require("../../config/emailConfig");

// Function to send email notifications to all admin users
const notifyAdminsAboutNewOrder = async (orderDetails) => {
  try {
    console.log('Starting admin notification process...');
    
    // Get all admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log('Found admin users:', adminUsers.length);
    
    if (!adminUsers.length) {
      console.log('No admin users found to notify');
      return;
    }

    // Log admin emails for debugging
    console.log('Admin emails:', adminUsers.map(admin => admin.email));

    // Verify SMTP connection before sending
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('SMTP verification failed for admin notification:', {
        message: verifyError.message,
        code: verifyError.code,
        command: verifyError.command,
        responseCode: verifyError.responseCode,
        response: verifyError.response
      });
      return;
    }

    // Prepare email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminUsers.map(admin => admin.email).join(','),
      subject: 'New Order Placed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Order Placed</h2>
          
          <p>A new order has been placed and requires your attention.</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Order Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Order ID:</strong> ${orderDetails._id}</li>
              <li><strong>Customer:</strong> ${orderDetails.userId}</li>
              <li><strong>Total Amount:</strong> $${orderDetails.totalAmount}</li>
              <li><strong>Payment Method:</strong> ${orderDetails.paymentMethod}</li>
              <li><strong>Order Status:</strong> ${orderDetails.orderStatus}</li>
              <li><strong>Order Date:</strong> ${new Date(orderDetails.orderDate).toLocaleString()}</li>
            </ul>
          </div>
          
          <div style="background-color: #f0f7ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p>Please log in to the admin panel to view more details and process the order:</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/orders" 
               style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Order
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="margin: 0;">Best regards,<br>Your E-commerce Team</p>
          </div>
        </div>
      `
    };

    // Send email to all admin users
    const info = await transporter.sendMail(mailOptions);
    console.log('Admin notification email sent successfully:', {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    });
  } catch (error) {
    console.error('Detailed error in notifyAdminsAboutNewOrder:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response,
      orderId: orderDetails._id
    });
  }
};

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartId,
      cartItems,
      shippingAddress,
      billingAddress,
      paymentMethod,
      totalAmount,
      shippingCharges,
      totalWithShipping,
      weight,
      couponCode,
      discount,
      freeShipping,
      isGuestOrder
    } = req.body;

    // Create the order
    const order = new Order({
      userId,
      cartId,
      cartItems,
      shippingAddress,
      billingAddress,
      paymentMethod,
      totalAmount,
      shippingCharges,
      totalWithShipping,
      weight,
      couponCode,
      discount,
      freeShipping,
      isGuestOrder,
      orderDate: new Date(),
      orderUpdateDate: new Date()
    });

    await order.save();

    // Notify admins about the new order
    await notifyAdminsAboutNewOrder(order);

    // Send order confirmation email
    try {
      let userEmail, userName;
      
      if (isGuestOrder) {
        userEmail = shippingAddress.email;
        userName = shippingAddress.name;
      } else {
        const user = await User.findById(userId);
        if (!user) {
          throw new Error('User not found');
        }
        userEmail = user.email;
        userName = user.name;
      }

      if (!userEmail) {
        throw new Error('No email address found for order confirmation');
      }

      const emailData = {
        email: userEmail,
        name: userName,
        orderNumber: order._id,
        totalAmount: order.totalWithShipping,
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        orderDate: order.orderDate
      };

      console.log('Sending order confirmation email with data:', {
        email: emailData.email,
        name: emailData.name,
        orderNumber: emailData.orderNumber
      });

      const emailResult = await sendOrderConfirmationEmail(emailData);
      
      if (!emailResult.success) {
        throw new Error(emailResult.message || 'Failed to send order confirmation email');
      }

      console.log('Order confirmation email sent successfully');
    } catch (emailError) {
      console.error('Error sending order confirmation email:', {
        error: emailError.message,
        stack: emailError.stack,
        orderId: order._id
      });
      // Don't fail the order creation if email fails
    }

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      orderId: order._id,
      order: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: "Error creating order: " + error.message
    });
  }
};

const capturePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentId, payerId, orderId } = req.body;

    let order = await Order.findById(orderId).session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Validate stock availability again before capturing payment
    for (const item of order.cartItems) {
      const product = await Product.findById(item.productId).session(session);
      
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.title}`,
        });
      }

      // Check if there's enough stock
      if (product.totalStock < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${item.title}. Available: ${product.totalStock}, Requested: ${item.quantity}`,
        });
      }

      // For COD orders, reduce stock immediately
      if (order.paymentMethod === "cod") {
        product.totalStock -= item.quantity;
        await product.save({ session });
      }
      // For Razorpay orders, reduce stock immediately since payment is already confirmed
      else if (order.paymentMethod === "razorpay") {
        product.totalStock -= item.quantity;
        await product.save({ session });
      }
    }

    // If a coupon was used, update its usage count
    if (order.couponCode) {
      // For guest users, check if the email has already used this coupon
      if (!order.userId && order.shippingAddress.email) {
        const usedCoupon = await GiftCard.findOne({
          code: order.couponCode,
          usedEmails: order.shippingAddress.email.toLowerCase()
        }).session(session);

        if (usedCoupon) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: 'This email has already used this coupon'
          });
        }
      } else if (order.userId) {
        // For logged-in users, check if they have already used this coupon
        const usedCoupon = await GiftCard.findOne({
          code: order.couponCode,
          usedBy: order.userId
        }).session(session);

        if (usedCoupon) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: 'You have already used this coupon'
          });
        }
      }

      // Then find the coupon and validate it
      const giftCard = await GiftCard.findOne({ 
        code: order.couponCode,
        status: 'active',
        expiryDate: { $gt: new Date() },
        $expr: { $lt: ["$currentUsageCount", "$maxUsageLimit"] }
      }).session(session);

      if (!giftCard) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired coupon code'
        });
      }

      // Update coupon usage
      const updateData = {
        $inc: { currentUsageCount: 1 }
      };

      if (order.userId) {
        updateData.$push = { usedBy: order.userId };
      } else if (order.shippingAddress.email) {
        updateData.$push = { usedEmails: order.shippingAddress.email.toLowerCase() };
      }

      await GiftCard.findByIdAndUpdate(giftCard._id, updateData, { session });
    }

    // Update order status
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentId;
    order.payerId = payerId;

    await order.save({ session });

    // Clear the cart
    const getCartId = order.cartId;
    await Cart.findByIdAndDelete(getCartId, { session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Order confirmed",
      data: order,
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId })
      .sort({ orderDate: -1 })
      .populate('cartItems.productId');
    
    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error in getAllOrdersByUser:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders"
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('cartItems.productId')
      .populate('userId', 'name email');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error in getOrderDetails:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching order details"
    });
  }
};

const checkStockAvailability = async (req, res) => {
  try {
    const { cartItems } = req.body;
    const stockStatus = [];

    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        stockStatus.push({
          productId: item.productId,
          available: false,
          message: "Product not found"
        });
        continue;
      }

      stockStatus.push({
        productId: item.productId,
        available: product.totalStock >= item.quantity,
        availableStock: product.totalStock,
        requestedQuantity: item.quantity
      });
    }

    const allAvailable = stockStatus.every(item => item.available);
    
    res.status(200).json({
      success: true,
      allAvailable,
      stockStatus
    });
  } catch (error) {
    console.error('Error in checkStockAvailability:', error);
    res.status(500).json({
      success: false,
      message: "Error checking stock availability"
    });
  }
};

module.exports = {
  createOrder,
  capturePayment,
  getAllOrdersByUser,
  getOrderDetails,
  checkStockAvailability
};