const express = require("express");
const {
  createSubCategory,
  getSubCategories,
  getSubCategoriesByCategory,
  deleteSubCategory,
  updateSubCategory,
} = require("../../controllers/admin/subCategoryController");

const router = express.Router();

// Route for creating a subcategory
router.post("/create", createSubCategory);

// Route for getting all subcategories
router.get("/", getSubCategories);

// Route for getting subcategories by category ID
router.get("/category/:categoryId", getSubCategoriesByCategory);

// Route to delete a subcategory by ID
router.delete('/:id', deleteSubCategory);

// Route to update a subcategory by ID
router.put('/:id', updateSubCategory);

module.exports = router;
