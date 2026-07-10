const express = require('express');
const { subscribeToNewsletter, getSubscribers, unsubscribeFromNewsletter } = require('../../controllers/shop/newsletterController');

const router = express.Router();

// POST route to handle newsletter subscription
router.post('/subscribe', subscribeToNewsletter);
router.post('/unsubscribe', unsubscribeFromNewsletter);
router.get('/subscribers', getSubscribers);

module.exports = router;
