require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/product");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await Product.find({});
  console.log("SUBCATEGORIES IN DB:");
  products.forEach(p => console.log(p._id, p.subcategory));
  process.exit();
}
run();
