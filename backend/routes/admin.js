const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllDocuments,
  getDashboardStats,
  approveDocument,
  rejectDocument,
  setUnderReview,
  getAllStudents,
  getAuditLogs,
} = require('../controllers/adminController');
const { getDocument, downloadDocument } = require('../controllers/documentController');

router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/documents', getAllDocuments);
router.get('/documents/:id', getDocument);
router.get('/documents/:id/download', downloadDocument);
router.put('/documents/:id/approve', approveDocument);
router.put('/documents/:id/reject', rejectDocument);
router.put('/documents/:id/review', setUnderReview);
router.get('/students', getAllStudents);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
