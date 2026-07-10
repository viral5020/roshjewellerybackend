// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/admin/transactionController');

router.post('/transactions', transactionController.createTransaction);
router.get('/transactions', transactionController.getAllTransactions);

module.exports = router;
