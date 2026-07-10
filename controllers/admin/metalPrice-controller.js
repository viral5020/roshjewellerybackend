const MetalPrice = require("../../models/MetalPrice");
const Product = require("../../models/product");

// GET  /api/admin/metal-prices/get
const getMetalPrices = async (req, res) => {
  try {
    let prices = await MetalPrice.findOne();
    if (!prices) {
      prices = { goldPrice: 0, silverPrice: 0, goldPrices: {}, silverPrices: {} };
    }
    res.status(200).json({
      success: true,
      data: prices,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error fetching metal prices",
    });
  }
};

// POST /api/admin/metal-prices/set
const setMetalPrices = async (req, res) => {
  try {
    const { goldPrice, silverPrice, goldPrices, silverPrices, diamondPricePerCarat } = req.body;

    const updateData = {};
    if (goldPrice !== undefined) updateData.goldPrice = Number(goldPrice);
    if (silverPrice !== undefined) updateData.silverPrice = Number(silverPrice);
    if (goldPrices !== undefined) updateData.goldPrices = goldPrices;
    if (silverPrices !== undefined) updateData.silverPrices = silverPrices;
    if (diamondPricePerCarat !== undefined) updateData.diamondPricePerCarat = Number(diamondPricePerCarat);

    // Upsert – create or update the single document
    const prices = await MetalPrice.findOneAndUpdate(
      {},
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Bulk-update gold products
    const goldProducts = await Product.find({
      metalType: "gold",
      gramWeight: { $gt: 0 },
    });

    for (const product of goldProducts) {
      let rate = prices.goldPrice || 0;
      if (product.purity && prices.goldPrices && prices.goldPrices[product.purity]) {
        rate = prices.goldPrices[product.purity];
      }
      
      const newPrice = Math.round(((product.gramWeight * rate) + (product.labourCost || 0) + (product.diamondPrice || 0)) * 100) / 100;
      product.price = newPrice;
      await product.save();
    }

    // Bulk-update silver products
    const silverProducts = await Product.find({
      metalType: "silver",
      gramWeight: { $gt: 0 },
    });

    for (const product of silverProducts) {
      let rate = prices.silverPrice || 0;
      if (product.purity && prices.silverPrices && prices.silverPrices[product.purity]) {
        rate = prices.silverPrices[product.purity];
      }
      
      const newPrice = Math.round(((product.gramWeight * rate) + (product.labourCost || 0) + (product.diamondPrice || 0)) * 100) / 100;
      product.price = newPrice;
      await product.save();
    }

    const totalUpdated = goldProducts.length + silverProducts.length;

    res.status(200).json({
      success: true,
      data: prices,
      updatedCount: totalUpdated,
      message: `Metal prices saved. ${totalUpdated} product(s) updated.`,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error updating metal prices",
    });
  }
};

module.exports = { getMetalPrices, setMetalPrices };
