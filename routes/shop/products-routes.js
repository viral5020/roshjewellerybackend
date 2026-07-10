const express = require("express");

const {
  getFilteredProducts,
  getProductDetails,
  getProductDetailsByName,
} = require("../../controllers/shop/products-controller");

const router = express.Router();

router.get("/get", getFilteredProducts);
router.get("/get/:id", getProductDetails);
router.get("/get/by-name/:title", getProductDetailsByName);
module.exports = router;