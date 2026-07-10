const CustomOrder = require("../../models/CustomOrder");

// Create new custom order request
const createCustomOrder = async (req, res) => {
  try {
    const { fullName, number, email, type, budget, message, fileUrl } = req.body;

    const newCustomOrder = new CustomOrder({
      fullName,
      number,
      email,
      type,
      budget,
      message,
      fileUrl,
    });

    await newCustomOrder.save();

    res.status(201).json({
      success: true,
      message: "Custom order request submitted successfully",
      data: newCustomOrder,
    });
  } catch (error) {
    console.error("Error creating custom order:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting custom order request",
    });
  }
};

// Fetch all custom orders for admin view
const getAllCustomOrders = async (req, res) => {
  try {
    const customOrders = await CustomOrder.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: customOrders,
    });
  } catch (error) {
    console.error("Error fetching custom orders:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching custom orders",
    });
  }
};

module.exports = {
  createCustomOrder,
  getAllCustomOrders,
};
