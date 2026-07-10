const Cart = require("../../models/Cart");
const Product = require("../../models/product");

const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity, size } = req.body;

    if (!userId || !productId || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    // Find the product and ensure it exists
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // If no cart exists for this user, create a new one
      cart = new Cart({ userId, items: [] });
    }

    // Check if the product already exists in the cart
    const findCurrentProductIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId && (item.size || "") === (size || "")
    );

    // If product not found in cart, push it, otherwise update the quantity
    if (findCurrentProductIndex === -1) {
      cart.items.push({
        productId,
        quantity,
        weight: product.weight,  // Add weight from product
        size: size || undefined,
      });
    } else {
      cart.items[findCurrentProductIndex].quantity += quantity;
    }

    await cart.save();
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

const fetchCartItems = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching cart for userId:', userId); // Add logging

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User id is mandatory!",
      });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "image title price salePrice weight",
    });

    if (!cart) {
      console.log('Cart not found for userId:', userId); // Add logging
      return res.status(404).json({
        success: false,
        message: "Cart not found!",
      });
    }

    const validItems = cart.items.filter(
      (productItem) => productItem.productId
    );

    // If there are invalid items (products not found), clean the cart
    if (validItems.length < cart.items.length) {
      console.log('Cleaning invalid items from cart for userId:', userId); // Add logging
      cart.items = validItems;
      await cart.save();
    }

    const populateCartItems = validItems.map((item) => ({
      productId: item.productId._id,
      image: item.productId.image,
      title: item.productId.title,
      price: item.productId.price,
      salePrice: item.productId.salePrice,
      weight: item.productId.weight,
      quantity: item.quantity,
      size: item.size,
    }));

    console.log('Successfully fetched cart for userId:', userId); // Add logging
    res.status(200).json({
      success: true,
      data: {
        ...cart._doc,
        items: populateCartItems,
      },
    });
  } catch (error) {
    console.error('Error in fetchCartItems:', error); // Enhanced error logging
    res.status(500).json({
      success: false,
      message: "Error fetching cart items",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateCartItemQty = async (req, res) => {
  try {
    const { userId, productId, quantity, size } = req.body;

    if (!userId || !productId || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found!",
      });
    }

    const findCurrentProductIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId && (item.size || "") === (size || "")
    );

    if (findCurrentProductIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Cart item not present!",
      });
    }

    const product = await Product.findById(productId);  // Fetch product to get weight
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });
    }

    cart.items[findCurrentProductIndex].quantity = quantity;
    cart.items[findCurrentProductIndex].weight = product.weight;  // Update weight if necessary
    await cart.save();

    await cart.populate({
      path: "items.productId",
      select: "image title price salePrice weight",
    });

    const populateCartItems = cart.items.map((item) => ({
      productId: item.productId ? item.productId._id : null,
      image: item.productId ? item.productId.image : null,
      title: item.productId ? item.productId.title : "Product not found",
      price: item.productId ? item.productId.price : null,
      salePrice: item.productId ? item.productId.salePrice : null,
      weight: item.productId ? item.productId.weight : null,  // Include weight
      quantity: item.quantity,
      size: item.size,
    }));

    res.status(200).json({
      success: true,
      data: {
        ...cart._doc,
        items: populateCartItems,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const { userId, productId, size } = req.params;
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "image title price salePrice weight",
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found!",
      });
    }

    cart.items = cart.items.filter(
      (item) => !(item.productId._id.toString() === productId && (item.size || "") === (size || ""))
    );

    await cart.save();

    await cart.populate({
      path: "items.productId",
      select: "image title price salePrice weight",
    });

    const populateCartItems = cart.items.map((item) => ({
      productId: item.productId ? item.productId._id : null,
      image: item.productId ? item.productId.image : null,
      title: item.productId ? item.productId.title : "Product not found",
      price: item.productId ? item.productId.price : null,
      salePrice: item.productId ? item.productId.salePrice : null,
      weight: item.productId ? item.productId.weight : null,  // Include weight
      quantity: item.quantity,
      size: item.size,
    }));

    res.status(200).json({
      success: true,
      data: {
        ...cart._doc,
        items: populateCartItems,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

module.exports = {
  addToCart,
  updateCartItemQty,
  deleteCartItem,
  fetchCartItems,
};
