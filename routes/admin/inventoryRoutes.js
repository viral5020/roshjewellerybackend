const express = require('express');
const router = express.Router();
const inventoryController = require('../../controllers/admin/inventoryController');

// Route to fetch all products for the inventory
router.get('/admin/Inventory', inventoryController.getProducts);

// Route to update stock of a particular product
router.patch('/admin/Inventory/:id', inventoryController.updateStock);

module.exports = router;
