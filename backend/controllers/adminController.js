const Document = require('../models/Document');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { signPDF } = require('../utils/signature');
const { sendApprovalEmail, sendRejectionEmail } = require('../utils/email');
const path = require('path');
const fs = require('fs');

// @desc   Get all documents (Admin)
// @route  GET /api/admin/documents
// @access Private (Admin)
const getAllDocuments = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { documentType: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Document.countDocuments(query);
    const documents = await Document.find(query)
      .populate('userId', 'name email rollNumber department')
      .populate('reviewedBy', 'name email')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      documents,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get dashboard stats
// @route  GET /api/admin/stats
// @access Private (Admin)
const getDashboardStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected, underReview, totalStudents] = await Promise.all([
      Document.countDocuments(),
      Document.countDocuments({ status: 'pending' }),
      Document.countDocuments({ status: 'approved' }),
      Document.countDocuments({ status: 'rejected' }),
      Document.countDocuments({ status: 'under_review' }),
      User.countDocuments({ role: 'student' }),
    ]);

    // Recent documents
    const recentDocuments = await Document.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Documents per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyStats = await Document.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: { total, pending, approved, rejected, underReview, totalStudents },
      recentDocuments,
      weeklyStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Approve & sign document
// @route  PUT /api/admin/documents/:id/approve
// @access Private (Admin)
const approveDocument = async (req, res) => {
  try {
    const { remarks, signatureText } = req.body;
    const document = await Document.findById(req.params.id).populate('userId', 'name email');

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (document.status === 'approved') {
      return res.status(400).json({ success: false, message: 'Document already approved' });
    }

    let signedFileUrl = null;
    let signedFileName = null;

    // Sign PDF if it's a PDF file
    if (document.mimeType === 'application/pdf') {
      const uploadDir = process.env.UPLOAD_PATH || './uploads';
      const originalPath = path.join(__dirname, '..', document.fileUrl);
      const signedFilename = `signed-${Date.now()}-${path.basename(document.fileUrl)}`;
      const signedPath = path.join(__dirname, '..', uploadDir, 'signed', signedFilename);

      const signed = await signPDF(
        originalPath,
        signedPath,
        req.user.name,
        signatureText || 'Academic Administration'
      );

      if (signed) {
        signedFileUrl = `/uploads/signed/${signedFilename}`;
        signedFileName = `signed-${document.fileName}`;
      }
    }

    document.status = 'approved';
    document.remarks = remarks || '';
    document.reviewedBy = req.user._id;
    document.reviewedAt = new Date();
    document.signedFileUrl = signedFileUrl;
    document.signedFileName = signedFileName;
    document.signatureData = {
      signerName: req.user.name,
      signatureText: signatureText || 'Academic Administration',
      signedAt: new Date(),
    };

    await document.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'DOCUMENT_APPROVED',
      documentId: document._id,
      details: `Document approved: ${document.title} for student ${document.userId.email}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Send email notification
    const downloadLink = `${process.env.CLIENT_URL}/dashboard`;
    const emailSent = await sendApprovalEmail(
      document.userId.email,
      document.userId.name,
      document.title,
      downloadLink
    );

    if (emailSent) {
      await AuditLog.create({
        userId: req.user._id,
        action: 'EMAIL_SENT',
        documentId: document._id,
        details: `Approval email sent to ${document.userId.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json({
      success: true,
      message: 'Document approved and signed successfully',
      document,
      emailSent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Reject document
// @route  PUT /api/admin/documents/:id/reject
// @access Private (Admin)
const rejectDocument = async (req, res) => {
  try {
    const { remarks } = req.body;
    const document = await Document.findById(req.params.id).populate('userId', 'name email');

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (document.status === 'rejected') {
      return res.status(400).json({ success: false, message: 'Document already rejected' });
    }

    document.status = 'rejected';
    document.remarks = remarks || 'Document does not meet requirements';
    document.reviewedBy = req.user._id;
    document.reviewedAt = new Date();
    await document.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'DOCUMENT_REJECTED',
      documentId: document._id,
      details: `Document rejected: ${document.title}. Reason: ${remarks}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Send rejection email
    const emailSent = await sendRejectionEmail(
      document.userId.email,
      document.userId.name,
      document.title,
      remarks
    );

    if (emailSent) {
      await AuditLog.create({
        userId: req.user._id,
        action: 'EMAIL_SENT',
        documentId: document._id,
        details: `Rejection email sent to ${document.userId.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.json({
      success: true,
      message: 'Document rejected',
      document,
      emailSent,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Set document under review
// @route  PUT /api/admin/documents/:id/review
// @access Private (Admin)
const setUnderReview = async (req, res) => {
  try {
    const document = await Document.findByIdAndUpdate(
      req.params.id,
      { status: 'under_review', reviewedBy: req.user._id },
      { new: true }
    ).populate('userId', 'name email');

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.json({ success: true, message: 'Document marked as under review', document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get all students
// @route  GET /api/admin/students
// @access Private (Admin)
const getAllStudents = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const query = { role: 'student' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const students = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    // Get document counts per student
    const studentIds = students.map((s) => s._id);
    const docCounts = await Document.aggregate([
      { $match: { userId: { $in: studentIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);

    const docCountMap = {};
    docCounts.forEach((d) => (docCountMap[d._id.toString()] = d.count));

    const enrichedStudents = students.map((s) => ({
      ...s.toObject(),
      documentCount: docCountMap[s._id.toString()] || 0,
    }));

    res.json({
      success: true,
      students: enrichedStudents,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get audit logs
// @route  GET /api/admin/audit-logs
// @access Private (Admin)
const getAuditLogs = async (req, res) => {
  try {
    const { action, page = 1, limit = 20 } = req.query;
    const query = {};
    if (action && action !== 'all') query.action = action;

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .populate('documentId', 'title')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      logs,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllDocuments,
  getDashboardStats,
  approveDocument,
  rejectDocument,
  setUnderReview,
  getAllStudents,
  getAuditLogs,
};
