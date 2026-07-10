const Order = require("../../models/Order");
const User = require("../../models/User");
const { sendOrderConfirmationEmail } = require("../../emailService");

// Function to send status update email
const sendStatusUpdateEmail = async (order, user) => {
  try {
    const emailData = {
      email: user.email,
      name: user.userName,
      orderNumber: order._id,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      orderStatus: order.orderStatus,
      orderDate: order.orderDate
    };

    await sendOrderConfirmationEmail(emailData);
    console.log('Status update email sent successfully');
  } catch (error) {
    console.error('Error sending status update email:', error);
  }
};

const getAllOrdersOfAllUsers = async (req, res) => {
  try {
    const orders = await Order.find({});

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const getOrderDetailsForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured!",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    // Get the user associated with the order
    const user = await User.findById(order.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found!",
      });
    }

    // Update order status
    order.orderStatus = orderStatus;
    order.orderUpdateDate = new Date();
    await order.save();

    // Send status update email
    await sendStatusUpdateEmail(order, user);

    res.status(200).json({
      success: true,
      message: "Order status is updated successfully!",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getSalesChartData = async (req, res) => {
  try {
    const orders = await Order.find(
      {
        orderDate: {
          $gte: new Date("2025-03-01"),
          $lte: new Date("2050-04-30T23:59:59.999Z"),
        },
      },
      {
        orderDate: 1,
        totalAmount: 1,
        _id: 1,
        userId: 1,
        cartItems: 1,
      }
    ).sort({ orderDate: 1 });

    const formattedOrders = orders.map(order => {
      const formattedDate = order.orderDate.toISOString().split('T')[0]; 
      const time = order.orderDate.toISOString().split('T')[1].split('.')[0];

      return {
        orderDate: formattedDate,
        totalAmount: order.totalAmount || 0,
        orderId: order._id,
        time: time,
        productName: order.cartItems && order.cartItems.length > 0 ? order.cartItems[0].title : 'N/A',
        customerName: order.userId || 'N/A',
      };
    });

    res.status(200).json({
      success: true,
      data: formattedOrders,
    });
  } catch (e) {
    console.error("Error occurred while fetching sales chart data:", e);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sales data!",
    });
  }
};

module.exports = {
  getAllOrdersOfAllUsers,
  getOrderDetailsForAdmin,
  updateOrderStatus,
  getSalesChartData,
};