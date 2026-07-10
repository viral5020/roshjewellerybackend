const Product = require("../../models/product");

const getFilteredProducts = async (req, res) => {
  try {
    const {
      category = [],
      brand = [],
      sortBy = "price-lowtohigh",
      metalType = [],
      diamondType = [],
      gramWeight = "",
      diamondCarat = "",
      colors = [],
    } = req.query;

    let filters = {};

    if (category.length) {
      filters.category = { $in: category.split(",") };
    }

    if (brand.length) {
      filters.brand = { $in: brand.split(",") };
    }

    if (metalType.length) {
      filters.metalType = { $in: metalType.split(",") };
    }

    if (diamondType.length) {
      filters.diamondType = { $in: diamondType.split(",") };
    }

    if (gramWeight) {
      const [min, max] = gramWeight.split(",").map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        filters.gramWeight = { $gte: min, $lte: max };
      }
    }

    if (diamondCarat) {
      const [min, max] = diamondCarat.split(",").map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        filters.diamondCarat = { $gte: min, $lte: max };
      }
    }

    let sort = {};

    switch (sortBy) {
      case "price-lowtohigh":
        sort.price = 1;

        break;
      case "price-hightolow":
        sort.price = -1;

        break;
      case "title-atoz":
        sort.title = 1;

        break;

      case "title-ztoa":
        sort.title = -1;

        break;

      default:
        sort.price = 1;
        break;
    }

    const products = await Product.find(filters).sort(sort);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
};
const getProductDetailsByName = async (req, res) => {
  try {
    const title = decodeURIComponent(req.params.title); // decode title in case it contains %20 or special chars
    
    // Convert hyphens to spaces and make the search case-insensitive
    const searchTitle = title.replace(/-/g, ' ');
    const product = await Product.findOne({ 
      title: { $regex: new RegExp(`^${searchTitle}$`, 'i') }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};




module.exports = { getFilteredProducts, getProductDetails, getProductDetailsByName };