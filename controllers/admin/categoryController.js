const mongoose = require("mongoose");
const { Category, Product } = require("../../models");

exports.createCategory = async (req, res) => {
    try {
      const { name, image, sizeChartImage } = req.body;
      console.log("Received category data:", { name, image, sizeChartImage }); // Log request data
  
      // Validate and create category logic here
      const newCategory = await Category.create({
        name,
        image,
        sizeChartImage,
      });
  
      console.log("Created category:", newCategory); // Log the created category
  
      res.status(201).json({
        success: true,
        category: newCategory,
      });
    } catch (error) {
      console.error("Error creating category:", error); // Log error details
      res.status(500).json({ success: false, message: "Error creating category" });
    }
  };
  


// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    return res.status(200).json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get a single category by id
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json({ category });
  } catch (error) {
    console.error("Error fetching category:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Update a category by id
exports.updateCategory = async (req, res) => {
  try {
    const { name, image, sizeChartImage } = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, image, sizeChartImage },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    return res.status(200).json({
      message: "Category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete a category by id
exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // First check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: "Category not found" 
      });
    }

    // Check if there are any products associated with this category
    // Using the category name since that's how it's stored in products
    const productsWithCategory = await Product.find({ category: category.name });
    
    if (productsWithCategory.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "Cannot delete category. Please delete all associated products first.",
        productCount: productsWithCategory.length,
        products: productsWithCategory.map(p => ({
          id: p._id,
          title: p.title
        }))
      });
    }

    // If no products found, proceed with deletion
    await Category.findByIdAndDelete(categoryId);
    
    return res.status(200).json({ 
      success: true,
      message: "Category deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};
