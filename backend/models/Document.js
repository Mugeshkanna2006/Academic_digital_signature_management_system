const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    documentType: {
      type: String,
      enum: ['bonafide', 'transcript', 'certificate', 'report', 'other'],
      required: [true, 'Document type is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending',
    },
    signedFileUrl: {
      type: String,
      default: null,
    },
    signedFileName: {
      type: String,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    signatureData: {
      signerName: String,
      signatureText: String,
      signedAt: Date,
    },
  },
  { timestamps: true }
);

// Index for search
documentSchema.index({ title: 'text', description: 'text' });
documentSchema.index({ userId: 1, status: 1 });
documentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
