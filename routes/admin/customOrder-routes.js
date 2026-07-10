const express = require("express");
const router = express.Router();
const {
  createCustomOrder,
  getAllCustomOrders,
} = require("../../controllers/admin/customOrder-controller");

router.post("/create", createCustomOrder);
router.get("/get", getAllCustomOrders);

module.exports = router;
