const express = require("express");

const {
  getMetalPrices,
  setMetalPrices,
} = require("../../controllers/admin/metalPrice-controller");

const router = express.Router();

router.get("/get", getMetalPrices);
router.post("/set", setMetalPrices);

module.exports = router;
