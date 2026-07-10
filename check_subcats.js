require("dotenv").config();
const mongoose = require("mongoose");
const SubCategory = require("./models/subCategory");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const subCats = await SubCategory.find({});
  console.log("SUBCATS:", subCats);
  process.exit();
}
run();
