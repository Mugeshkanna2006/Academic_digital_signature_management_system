const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const path = require('path');
const fs = require('fs');

// @desc   Upload document
// @route  POST /api/documents/upload
// @access Private (Student)
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { title, documentType, description } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;

    const document = await Document.create({
      userId: req.user._id,
      title,
      documentType,
      description,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'DOCUMENT_UPLOADED',
      documentId: document._id,
      details: `Document uploaded: ${title}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get student's documents
// @route  GET /api/documents/my
// @access Private (Student)
const getMyDocuments = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = { userId: req.user._id };

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
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      documents,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get single document
// @route  GET /api/documents/:id
// @access Private
const getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('userId', 'name email rollNumber department')
      .populate('reviewedBy', 'name email');

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Students can only view their own documents
    if (req.user.role === 'student' && document.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Delete document (student only, pending status)
// @route  DELETE /api/documents/:id
// @access Private (Student)
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (document.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (document.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only delete pending documents' });
    }

    // Remove file from disk
    const filePath = path.join(__dirname, '..', document.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await AuditLog.create({
      userId: req.user._id,
      action: 'DOCUMENT_DELETED',
      documentId: document._id,
      details: `Document deleted: ${document.title}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await document.deleteOne();

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Download signed document
// @route  GET /api/documents/:id/download
// @access Private
const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (req.user.role === 'student' && document.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const fileUrl = document.signedFileUrl || document.fileUrl;
    const filePath = path.join(__dirname, '..', fileUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }

    await AuditLog.create({
      userId: req.user._id,
      action: 'DOCUMENT_DOWNLOADED',
      documentId: document._id,
      details: `Document downloaded: ${document.title}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.download(filePath, document.signedFileName || document.fileName);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadDocument, getMyDocuments, getDocument, deleteDocument, downloadDocument };
