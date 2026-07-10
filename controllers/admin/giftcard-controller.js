const GiftCard = require('../../models/Giftcard');
const mongoose = require('mongoose');

// Create a new Gift Card
const createGiftCard = async (req, res) => {
  console.log('Creating new gift card with data:', req.body);
  const { 
    code, 
    description, 
    expiryDate, 
    status, 
    maxUsageLimit, 
    minPurchaseAmount,
    category,
    product,
    isUserSpecific,
    userId,
    isFirstOrderOnly,
    paymentMethodDiscount,
    paymentMethodDiscountType,
    eligiblePaymentMethods,
    freeShipping
  } = req.body;

  try {
    // Validate required fields
    if (!code || !expiryDate) {
      return res.status(400).json({ 
        message: 'Missing required fields: code and expiryDate are required.' 
      });
    }

    // Check if the gift card code already exists
    const existingGiftCard = await GiftCard.findOne({ code });
    if (existingGiftCard) {
      console.log('Gift card code already exists:', code);
      return res.status(400).json({ message: 'Gift card code already exists.' });
    }

    // Validate expiry date
    if (new Date(expiryDate) < new Date()) {
      console.log('Invalid expiry date:', expiryDate);
      return res.status(400).json({ message: 'Expiry date must be in the future.' });
    }

    // Handle category and product IDs
    let categoryId = null;
    let productId = null;

    if (category && category !== 'all') {
      try {
        categoryId = new mongoose.Types.ObjectId(category);
      } catch (error) {
        console.log('Invalid category ID:', category);
        return res.status(400).json({ message: 'Invalid category ID.' });
      }
    }

    if (product && product !== 'all') {
      try {
        productId = new mongoose.Types.ObjectId(product);
      } catch (error) {
        console.log('Invalid product ID:', product);
        return res.status(400).json({ message: 'Invalid product ID.' });
      }
    }

    // Create gift card data object with only the fields we want to save
    const giftCardData = {
      code: code.trim(),
      description: description ? description.trim() : '',
      expiryDate: new Date(expiryDate),
      status: status || 'active',
      maxUsageLimit: Number(maxUsageLimit) || 1,
      minPurchaseAmount: Number(minPurchaseAmount) || 0,
      category: categoryId,
      product: productId,
      isUserSpecific: Boolean(isUserSpecific),
      userId: isUserSpecific ? userId : null,
      isFirstOrderOnly: Boolean(isFirstOrderOnly),
      paymentMethodDiscount: Number(paymentMethodDiscount) || 0,
      paymentMethodDiscountType: paymentMethodDiscountType || 'percentage',
      eligiblePaymentMethods: Array.isArray(eligiblePaymentMethods) ? eligiblePaymentMethods : [],
      freeShipping: Boolean(freeShipping),
      currentUsageCount: 0
    };

    // Create a new gift card
    const newGiftCard = new GiftCard(giftCardData);
    
    console.log('Saving new gift card:', newGiftCard);
    await newGiftCard.save();
    console.log('Gift card saved successfully');

    // Populate category and product details before sending response
    await newGiftCard.populate([
      { path: 'category', select: 'name' },
      { path: 'product', select: 'title' }
    ]);
    console.log('Gift card populated with details:', newGiftCard);

    res.status(201).json({
      message: 'Gift card created successfully!',
      giftCard: newGiftCard,
    });
  } catch (error) {
    console.error('Error creating gift card:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.code) {
        return res.status(400).json({ 
          message: 'A gift card with this code already exists.',
          error: error.message 
        });
      } else {
        return res.status(400).json({ 
          message: 'Duplicate entry error. Please try again with different values.',
          error: error.message 
        });
      }
    }
    
    res.status(500).json({ 
      message: 'Server error, please try again later.',
      error: error.message 
    });
  }
};

// Get all Gift Cards
const getAllGiftCards = async (req, res) => {
  try {
    console.log('Fetching all gift cards...');
    const giftCards = await GiftCard.find()
      .populate([
        { path: 'category', select: 'name' },
        { path: 'product', select: 'title' }
      ])
      .sort({ createdAt: -1 }); // Sort by creation date, newest first
    
    console.log(`Found ${giftCards.length} gift cards`);
    
    if (!giftCards) {
      console.log('No gift cards found');
      return res.status(200).json([]);
    }

    res.status(200).json(giftCards);
  } catch (error) {
    console.error('Error in getAllGiftCards:', error);
    res.status(500).json({ 
      message: 'Error fetching gift cards.',
      error: error.message 
    });
  }
};

// Update a Gift Card
const updateGiftCard = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Validate if the gift card exists
    const giftCard = await GiftCard.findById(id);
    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found.' });
    }

    // If code is being updated, check for uniqueness
    if (updateData.code && updateData.code !== giftCard.code) {
      const existingGiftCard = await GiftCard.findOne({ code: updateData.code });
      if (existingGiftCard) {
        return res.status(400).json({ message: 'Gift card code already exists.' });
      }
    }

    // Validate expiry date if being updated
    if (updateData.expiryDate && new Date(updateData.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'Expiry date must be in the future.' });
    }

    // Handle category and product IDs if being updated
    if (updateData.category && updateData.category !== 'all') {
      try {
        updateData.category = new mongoose.Types.ObjectId(updateData.category);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid category ID.' });
      }
    }

    if (updateData.product && updateData.product !== 'all') {
      try {
        updateData.product = new mongoose.Types.ObjectId(updateData.product);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid product ID.' });
      }
    }

    // If status is being changed from inactive to active, reset usage count and usedBy array
    if (updateData.status === 'active' && giftCard.status === 'inactive') {
      updateData.currentUsageCount = 0;
      updateData.usedBy = [];
    }

    // Update the gift card
    const updatedGiftCard = await GiftCard.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate([
      { path: 'category', select: 'name' },
      { path: 'product', select: 'title' }
    ]);

    res.json({
      message: 'Gift card updated successfully!',
      giftCard: updatedGiftCard
    });
  } catch (error) {
    console.error('Error updating gift card:', error);
    res.status(500).json({ message: 'Error updating gift card.' });
  }
};

// Delete a Gift Card
const deleteGiftCard = async (req, res) => {
  const { id } = req.params;

  try {
    const giftCard = await GiftCard.findById(id);
    if (!giftCard) {
      return res.status(404).json({ message: 'Gift card not found.' });
    }

    await GiftCard.findByIdAndDelete(id);
    res.json({ message: 'Gift card deleted successfully!' });
  } catch (error) {
    console.error('Error deleting gift card:', error);
    res.status(500).json({ message: 'Error deleting gift card.' });
  }
};

module.exports = {
  createGiftCard,
  getAllGiftCards,
  updateGiftCard,
  deleteGiftCard
};
