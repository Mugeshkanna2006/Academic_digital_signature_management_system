const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadDocument,
  getMyDocuments,
  getDocument,
  deleteDocument,
  downloadDocument,
} = require('../controllers/documentController');

router.post('/upload', protect, upload.single('document'), uploadDocument);
router.get('/my', protect, getMyDocuments);
router.get('/:id', protect, getDocument);
router.delete('/:id', protect, deleteDocument);
router.get('/:id/download', protect, downloadDocument);

module.exports = router;
