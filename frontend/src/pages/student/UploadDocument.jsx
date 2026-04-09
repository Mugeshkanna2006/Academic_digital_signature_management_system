import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiFile, FiX } from 'react-icons/fi';

const DOC_TYPES = [
  { value: 'bonafide', label: '📋 Bonafide Certificate' },
  { value: 'transcript', label: '📄 Transcript' },
  { value: 'certificate', label: '🏆 Certificate' },
  { value: 'report', label: '📝 Report' },
  { value: 'other', label: '📁 Other' },
];

export default function UploadDocument() {
  const [form, setForm] = useState({ title: '', documentType: '', description: '' });
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();
  const navigate = useNavigate();

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleFile = (f) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(f.type)) { toast.error('Only PDF, JPG, and PNG files allowed'); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error('File must be under 10MB'); return; }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file'); return; }
    if (!form.title.trim()) { toast.error('Please enter a title'); return; }
    if (!form.documentType) { toast.error('Please select a document type'); return; }

    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', form.title);
    formData.append('documentType', form.documentType);
    formData.append('description', form.description);

    setLoading(true);
    setProgress(0);
    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / e.total)),
      });
      toast.success('Document uploaded successfully!');
      navigate('/my-documents');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Upload Document</h1>
          <p>Submit a document for admin review and digital signature.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          <form onSubmit={handleSubmit}>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div><h2>Document Details</h2><p>Fill in the information about your document</p></div>
              </div>

              <div className="form-group">
                <label className="form-label">Document Title *</label>
                <input id="doc-title" name="title" type="text" className="form-input" placeholder="e.g. Bonafide Certificate Request" value={form.title} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label className="form-label">Document Type *</label>
                <select id="doc-type" name="documentType" className="form-select" value={form.documentType} onChange={handleChange} required>
                  <option value="">-- Select type --</option>
                  {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description (Optional)</label>
                <textarea id="doc-desc" name="description" className="form-textarea" placeholder="Briefly describe your request..." value={form.description} onChange={handleChange} />
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div><h2>Upload File</h2><p>PDF, JPG, PNG — max 10MB</p></div>
              </div>

              <div
                className={`upload-zone${dragging ? ' dragging' : ''}`}
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                <div className="upload-icon"><FiUploadCloud /></div>
                <h3>{dragging ? 'Drop file here' : 'Drag & drop your file'}</h3>
                <p>or click to browse from your computer</p>
                <div className="file-types">
                  {['PDF', 'JPG', 'PNG'].map(t => <span key={t} className="file-type-chip">{t}</span>)}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
              </div>

              {file && (
                <div className="selected-file">
                  <FiFile size={18} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{file.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                  <button type="button" onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                    <FiX size={16} />
                  </button>
                </div>
              )}

              {loading && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Uploading...</span><span>{progress}%</span>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', transition: 'width 0.3s ease', borderRadius: 8 }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button id="upload-submit-btn" type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                  {loading ? 'Uploading...' : <><FiUploadCloud size={16} /> Submit for Signature</>}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/my-documents')} disabled={loading}>Cancel</button>
              </div>
            </div>
          </form>

          <div className="card">
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📌 Guidelines</h2>
            {[
              ['📄 File Format', 'PDF is preferred for signing. JPG/PNG also accepted.'],
              ['📦 File Size', 'Maximum file size is 10MB per document.'],
              ['⏱️ Review Time', 'Admin typically reviews within 1-2 business days.'],
              ['📧 Notification', "You'll receive an email once your document is processed."],
              ['🔒 Security', 'All documents are stored securely and encrypted.'],
            ].map(([title, desc]) => (
              <div key={title} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
