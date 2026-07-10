const Invoice = require('../../models/Invoice');

// Create a new invoice
const createInvoice = async (req, res) => {
  try {
    const {
      clientName, clientEmail, billingAddress, shippingAddress, invoiceNumber, invoiceDate,
      paymentMethod, dueDate, poNumber, logo, items, notes, terms, amountPaid, taxRate, subtotal
    } = req.body;

    if (!clientName || !clientEmail) {
      return res.status(400).json({ message: "Client name and email are required." });
    }

    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    const balanceDue = totalAmount - amountPaid;

    const newInvoice = new Invoice({
      clientName,
      clientEmail,
      billingAddress,
      shippingAddress,
      invoiceNumber,
      invoiceDate,
      paymentMethod,
      dueDate,
      poNumber,
      logo,
      items,
      notes,
      terms,
      amountPaid,
      taxRate,
      subtotal,
      taxAmount,
      totalAmount,
      balanceDue
    });

    const savedInvoice = await newInvoice.save();

    res.status(201).json({ message: 'Invoice created successfully!', invoice: savedInvoice });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating invoice" });
  }
};

// Get all invoices
const getInvoices = async (req, res) => {
    try {
      const invoices = await Invoice.find();
      res.status(200).json({ invoices });  // Wrap invoices in an object with the 'invoices' key
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching invoices" });
    }
  };

// Get a specific invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.status(200).json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching invoice" });
  }
};

// Update an invoice
const updateInvoice = async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating invoice" });
  }
};

// Delete an invoice
const deleteInvoice = async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting invoice" });
  }
};

module.exports = { createInvoice, getInvoices, getInvoiceById, updateInvoice, deleteInvoice };
