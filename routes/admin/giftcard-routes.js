const express = require('express');
const { createGiftCard, getAllGiftCards, updateGiftCard, deleteGiftCard } = require('../../controllers/admin/giftcard-controller');

const router = express.Router();

// Route to create a new gift card
router.post('/create', createGiftCard);

// Route to fetch all gift cards
router.get('/', getAllGiftCards);

// Route to update a gift card
router.put('/:id', updateGiftCard);

// Route to delete a gift card
router.delete('/:id', deleteGiftCard);

module.exports = router;
