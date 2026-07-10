const Wishlist = require("../../models/Wishlist")
const mongoose = require('mongoose'); // Import mongoose


exports.create = async (req, res) => {
  try {
    const {
      userId,
      productId,
      image,
      title,
      description,
      category,
      brand,
      price,
      salePrice,
      weight,
      totalStock,
      averageReview
    } = req.body;

    console.log('Creating wishlist item:', { userId, productId }); // Add logging

    // Check if the product is already in the user's wishlist
    const existingWishlistItem = await Wishlist.findOne({ 
      userId: userId, 
      productId: productId 
    });

    console.log('Existing wishlist item:', existingWishlistItem); // Add logging

    if (existingWishlistItem) {
      // If the product is already in the wishlist, send a response with an error
      return res.status(400).json({
        success: false,
        message: 'Product is already in your wishlist',
      });
    }

    // Create a new wishlist item with the product details
    const newWishlistItem = new Wishlist({
      userId: userId,
      productId: productId,
      image,
      title,
      description,
      category,
      brand,
      price,
      salePrice,
      weight,
      totalStock,
      averageReview,
    });

    const created = await newWishlistItem.save(); // Save to the database
    console.log('Created wishlist item:', created); // Add logging

    // Respond with success
    res.status(201).json({
      success: true,
      message: 'Product added to wishlist',
      data: created,
    });
  } catch (error) {
    console.error('Error adding product to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding product to wishlist, please try again later',
    });
  }
};

exports.getByUserId = async (req, res) => {
  try {
    const { id } = req.params; // The user ID from the URL params
    console.log('Fetching wishlist for user:', id); // Add logging

    let skip = 0;
    let limit = 0;

    // If pagination params are provided, set them
    if (req.query.page && req.query.limit) {
      const pageSize = parseInt(req.query.limit);
      const page = parseInt(req.query.page);
      skip = pageSize * (page - 1);
      limit = pageSize;
    }

    // Fetch wishlist items for the given user ID
    const result = await Wishlist.find({ userId: id })
      .skip(skip)
      .limit(limit);

    console.log('Found wishlist items:', result); // Add logging

    // Fetch the total count of wishlist items for pagination purposes
    const totalResults = await Wishlist.find({ userId: id }).countDocuments();

    res.set('X-Total-Count', totalResults); // Return the total count in the response header
    res.status(200).json(result); // Send the wishlist items as the response
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Error fetching your wishlist, please try again later' });
  }
};


exports.updateById=async(req,res)=>{
    try {
        const {id}=req.params
        const updated=await Wishlist.findByIdAndUpdate(id,req.body,{new:true}).populate("product")
        res.status(200).json(updated)
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Error updating your wishlist, please try again later"})
    }
}
exports.deleteById = async (req, res) => {
  try {
    const itemId = req.params.id;
    console.log('Item ID:', itemId);  // Log to see the ID being passed
    
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid item ID' 
      });
    }

    const deletedItem = await Wishlist.findByIdAndDelete(itemId);
    console.log('Deleted Item:', deletedItem);  // Check what the result is

    if (!deletedItem) {
      return res.status(404).json({ 
        success: false,
        message: 'Item not found in wishlist' 
      });
    }

    res.status(200).json({ 
      success: true,
      message: 'Item removed from wishlist successfully',
      deletedItem 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Error removing item from wishlist',
      error: err.message 
    });
  }
};
