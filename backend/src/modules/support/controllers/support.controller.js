const SupportTicket = require('../../../models/SupportTicket');
const { sendNotification } = require('../../../utils/notification');

exports.createTicket = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    const ticket = await SupportTicket.create({ name, email, subject, message });

    // Notify admins
    await sendNotification({
      recipient: 'admins',
      type: 'SUPPORT_TICKET',
      title: 'New Support Ticket',
      message: `${name} has submitted a new support ticket regarding "${subject}".`,
      data: { targetUrl: '/admin/support' }
    });

    res.status(201).json({ success: true, data: ticket, message: 'Message sent successfully. We will get back to you soon.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminResponse } = req.body;

    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const updateData = { status };
    if (adminResponse !== undefined) {
        updateData.adminResponse = adminResponse;
    }

    const ticket = await SupportTicket.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.status(200).json({ success: true, data: ticket, message: 'Ticket status updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await SupportTicket.findByIdAndDelete(id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        res.status(200).json({ success: true, message: 'Ticket deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMyTickets = async (req, res) => {
    try {
        if (!req.user || !req.user.email) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const tickets = await SupportTicket.find({ email: req.user.email }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
