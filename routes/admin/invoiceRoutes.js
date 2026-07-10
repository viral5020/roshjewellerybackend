const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice
} = require('../../controllers/admin/invoiceController');

// Route for creating a new invoice
router.post('/', createInvoice);

// Route for getting all invoices
router.get('/', getInvoices);

// Route for getting a specific invoice by ID
router.get('/:id', getInvoiceById);

// Route for updating an invoice by ID
router.put('/:id', updateInvoice);

// Route for deleting an invoice by ID
router.delete('/:id', deleteInvoice);

module.exports = router;
