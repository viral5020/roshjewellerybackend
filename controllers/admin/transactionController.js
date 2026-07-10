// controllers/transactionController.js
const Transaction = require('../../models/MProfitStyleForm');

exports.createTransaction = async (req, res) => {
    try {
      const { purchases, sales, charges, meta } = req.body;
  
      // Create a new transaction with the provided data
      const newTransaction = new Transaction({ purchases, sales, charges, meta });
      
      // Save the new transaction in the database
      await newTransaction.save();
  
      // Send a successful response with the saved transaction data
      res.status(201).json({
        message: 'Transaction saved successfully',
        transaction: newTransaction
      });
    } catch (error) {
      console.error('Error saving transaction:', error);
      
      // Send an error response if the saving fails
      res.status(500).json({
        error: 'Failed to save transaction'
      });
    }
  };

  // Fetch all transactions
exports.getAllTransactions = async (req, res) => {
    try {
      const transactions = await Transaction.find().sort({ createdAt: -1 });
      res.status(200).json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  };
  
