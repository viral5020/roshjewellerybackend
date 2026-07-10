require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/product");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const product = await Product.findOne({});
  console.log("SUBCATEGORY:", product.subcategory);
  process.exit();
}
run();
