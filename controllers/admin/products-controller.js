const { imageUploadUtil } = require("../../helpers/cloudinary");
const Product = require("../../models/product");
const Category = require("../../models/Category");
const Subcategory = require("../../models/SubCategory");
const User = require("../../models/User");
const { sendNewProductEmail } = require("../../emailService");
const MetalPrice = require("../../models/MetalPrice");

const handleImageUpload = async (req, res) => {
  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const url = "data:" + req.file.mimetype + ";base64," + b64;
    const result = await imageUploadUtil(url);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: error?.message || "Error occured",
      fullError: error
    });
  }
};

// Add a new product
const addProduct = async (req, res) => {
  try {
    let {
      image,
      subImages,
      title,
      description,
      category,    // ID
      subcategory, // ID
      brand,
      price,
      salePrice,
      weight,
      totalStock,
      averageReview,
      metalType,
      diamondType,
      gramWeight,
      diamondCarat,
      colors,
      colorImages,
      video,
      purity,
      labourCost,
      diamondPrice,
      diamondColor
    } = req.body;

    // ✅ Fetch and store names instead of IDs
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }
    category = categoryDoc.name;

    const subcategoryDoc = await Subcategory.findById(subcategory);
    if (!subcategoryDoc) {
      return res.status(400).json({ success: false, message: "Invalid subcategory ID" });
    }
    subcategory = subcategoryDoc.name;

    let finalPrice = price || 0;
    if ((metalType === "gold" || metalType === "silver") && gramWeight > 0) {
      const prices = await MetalPrice.findOne() || { goldPrice: 0, silverPrice: 0, goldPrices: {}, silverPrices: {} };
      let rate = metalType === "gold" ? prices.goldPrice : prices.silverPrice;
      
      if (metalType === "gold" && purity && prices.goldPrices && prices.goldPrices[purity]) {
        rate = prices.goldPrices[purity];
      } else if (metalType === "silver" && purity && prices.silverPrices && prices.silverPrices[purity]) {
        rate = prices.silverPrices[purity];
      }

      finalPrice = Math.round(((Number(gramWeight) * rate) + Number(labourCost || 0) + Number(diamondPrice || 0)) * 100) / 100;
    }

    const newProduct = new Product({
      image,
      subImages: Array.isArray(subImages) ? subImages : [],
      title,
      description,
      category,     // name now
      subcategory,  // name now
      brand,
      price: finalPrice,
      salePrice: 0,
      weight,
      totalStock,
      averageReview,
      metalType,
      diamondType,
      gramWeight,
      diamondCarat,
      colors: Array.isArray(colors) ? colors : [],
      colorImages: Array.isArray(colorImages) ? colorImages : [],
      video,
      purity,
      labourCost: Number(labourCost || 0),
      diamondPrice: Number(diamondPrice || 0),
      diamondColor
    });

    await newProduct.save();

    // Get all users for email notification
    const users = await User.find();
    const userEmails = users.map(user => user.email);

    // Send email notifications after successful product creation
    if (userEmails.length > 0) {
      await sendNewProductEmail(newProduct, userEmails);
    }

    res.status(201).json({
      success: true,
      data: newProduct,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occurred",
    });
  }
};

// Fetch all products
const fetchAllProducts = async (req, res) => {
  try {
    const listOfProducts = await Product.find({});
    res.status(200).json({
      success: true,
      data: listOfProducts,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
};

// Edit a product
const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      image,
      subImages,
      title,
      description,
      category,
      subcategory,
      brand,
      price,
      salePrice,
      weight,
      totalStock,
      averageReview,
      metalType,
      diamondType,
      gramWeight,
      diamondCarat,
      colors,
      colorImages,
      video,
      purity,
      labourCost,
      diamondPrice,
      diamondColor,
      isBestSeller,
      isNewArrival
    } = req.body;

    console.log("Received subImages for edit:", subImages); // Debug log

    let findProduct = await Product.findById(id);
    if (!findProduct)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    findProduct.title = title || findProduct.title;
    findProduct.description = description || findProduct.description;
    findProduct.category = category || findProduct.category;
    findProduct.subcategory = subcategory || findProduct.subcategory;
    findProduct.brand = brand || findProduct.brand;
    findProduct.salePrice = 0; // Removing salePrice logic
    findProduct.weight = weight || findProduct.weight;
    findProduct.totalStock = totalStock || findProduct.totalStock;
    findProduct.image = image || findProduct.image;
    findProduct.averageReview = averageReview || findProduct.averageReview;
    findProduct.metalType = metalType !== undefined ? metalType : findProduct.metalType;
    findProduct.diamondType = diamondType !== undefined ? diamondType : findProduct.diamondType;
    findProduct.gramWeight = gramWeight !== undefined ? (gramWeight === "" ? 0 : gramWeight) : findProduct.gramWeight;
    findProduct.diamondCarat = diamondCarat !== undefined ? (diamondCarat === "" ? 0 : diamondCarat) : findProduct.diamondCarat;
    findProduct.colors = colors !== undefined ? (Array.isArray(colors) ? colors : []) : findProduct.colors;
    findProduct.colorImages = colorImages !== undefined ? (Array.isArray(colorImages) ? colorImages : []) : findProduct.colorImages;
    findProduct.video = video !== undefined ? video : findProduct.video;
    findProduct.purity = purity !== undefined ? purity : findProduct.purity;
    findProduct.labourCost = labourCost !== undefined ? Number(labourCost || 0) : findProduct.labourCost;
    findProduct.diamondPrice = diamondPrice !== undefined ? Number(diamondPrice || 0) : findProduct.diamondPrice;
    findProduct.diamondColor = diamondColor !== undefined ? diamondColor : findProduct.diamondColor;
    findProduct.isBestSeller = isBestSeller !== undefined ? isBestSeller : findProduct.isBestSeller;
    findProduct.isNewArrival = isNewArrival !== undefined ? isNewArrival : findProduct.isNewArrival;

    // Auto-calculate price if metalType is gold or silver
    if ((findProduct.metalType === "gold" || findProduct.metalType === "silver") && findProduct.gramWeight > 0) {
      const prices = await MetalPrice.findOne() || { goldPrice: 0, silverPrice: 0, goldPrices: {}, silverPrices: {} };
      let rate = findProduct.metalType === "gold" ? prices.goldPrice : prices.silverPrice;
      
      if (findProduct.metalType === "gold" && findProduct.purity && prices.goldPrices && prices.goldPrices[findProduct.purity]) {
        rate = prices.goldPrices[findProduct.purity];
      } else if (findProduct.metalType === "silver" && findProduct.purity && prices.silverPrices && prices.silverPrices[findProduct.purity]) {
        rate = prices.silverPrices[findProduct.purity];
      }

      findProduct.price = Math.round(((Number(findProduct.gramWeight) * rate) + Number(findProduct.labourCost || 0) + Number(findProduct.diamondPrice || 0)) * 100) / 100;
    } else {
      findProduct.price = price === "" ? 0 : price || findProduct.price;
    }

    // Update subImages if provided
    if (subImages !== undefined) {
      findProduct.subImages = Array.isArray(subImages) ? subImages : [];
    }

    await findProduct.save();
    res.status(200).json({
      success: true,
      data: findProduct,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occurred",
    });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
};

// Update stock of a product
const updateStock = async (req, res) => {
  const { id } = req.params;
  const { stockChange } = req.body;

  try {
    // Find the product by its ID
    let product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Update the stock by adding the stockChange value
    product.totalStock += stockChange;

    // Ensure stock does not go below zero
    if (product.totalStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });
    }

    // Save the updated product
    await product.save();

    // Respond with the updated product
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occurred while updating stock",
    });
  }
};

module.exports = {
  handleImageUpload,
  addProduct,
  fetchAllProducts,
  editProduct,
  deleteProduct,
  updateStock,  // Export the updateStock function
};
