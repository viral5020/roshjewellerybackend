const SubCategory = require("../../models/SubCategory");
const Category = require("../../models/Category");
const mongoose = require('mongoose');
// Example createSubCategory controller
exports.createSubCategory = async (req, res) => {
  try {
    const { name, category, sizeChartImage } = req.body;

    // Validate the input
    if (!name || !category) {
      return res.status(400).json({ message: "Name and categoryId are required" });
    }
    // console.log(name, category);
    // Check if the provided categoryId is valid
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: "Invalid categoryId" });
    }

    // Create new subcategory
    const newSubCategory = new SubCategory({
      name,
      category, // category should be the ObjectId
      sizeChartImage: sizeChartImage || null,
      image: req.body.image || null,
    });

    await newSubCategory.save();
    res.status(201).json({ success: true, message: "Subcategory created", subCategory: newSubCategory });
  } catch (error) {
    console.error("Error in createSubCategory:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getSubCategories = async (req, res) => {
  try {
    const subCategories = await SubCategory.find().populate("category", "name");
    res.status(200).json({ success: true, subCategories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Fetch subcategories for a specific category
exports.getSubCategoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params; // Extract categoryId from the request params

    // Validate the categoryId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    // Find subcategories by categoryId
    const subCategories = await SubCategory.find({ category: categoryId }).populate("category", "name");

    // Return subcategories
    res.status(200).json({ success: true, subCategories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a subcategory by ID
exports.deleteSubCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const subCategory = await SubCategory.findByIdAndDelete(id);

    if (!subCategory) {
      return res.status(404).json({ success: false, message: 'Subcategory not found' });
    }

    return res.status(200).json({ success: true, message: 'Subcategory deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Update a subcategory by ID
exports.updateSubCategory = async (req, res) => {
  const { id } = req.params;
  const { name, category, sizeChartImage, image } = req.body;

  try {
    // Find subcategory and update
    const updatedSubCategory = await SubCategory.findByIdAndUpdate(id, { name, category, sizeChartImage, image }, { new: true });

    if (!updatedSubCategory) {
      return res.status(404).json({ success: false, message: 'Subcategory not found' });
    }

    return res.status(200).json({ success: true, subCategory: updatedSubCategory });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};
