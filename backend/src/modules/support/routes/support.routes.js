const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const { protect, authorize } = require('../../../middlewares/auth.middleware');

// Public route to submit ticket
router.post('/', supportController.createTicket);

// Admin routes to view/manage tickets
router.get('/admin', protect, authorize('admin', 'superadmin'), supportController.getTickets);
router.patch('/admin/:id/status', protect, authorize('admin', 'superadmin'), supportController.updateTicketStatus);
router.delete('/admin/:id', protect, authorize('admin', 'superadmin'), supportController.deleteTicket);

module.exports = router;
