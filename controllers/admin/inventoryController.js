const Product = require('../../models/product'); // Import your Product model

// Fetch all products for the inventory page
const getProducts = async (req, res) => {
  try {
    const products = await Product.find(); // Fetch all products from the database
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update the stock of a particular product (increase or decrease)
const updateStock = async (req, res) => {
  const { id } = req.params;
  const { stockChange } = req.body; // stockChange will be a positive or negative number

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update the stock by adding stockChange
    product.totalStock += stockChange;

    // Ensure stock doesn't go negative
    if (product.totalStock < 0) {
      return res.status(400).json({ message: 'Stock cannot be negative' });
    }

    await product.save();
    res.json({ message: 'Stock updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  updateStock,
};
