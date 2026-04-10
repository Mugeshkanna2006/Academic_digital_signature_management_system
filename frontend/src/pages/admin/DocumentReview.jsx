import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import StatusBadge from '../../components/StatusBadge';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiSearch, FiCheck, FiX, FiEye, FiDownload, FiRefreshCw, FiExternalLink } from 'react-icons/fi';

const DOC_ICON = { bonafide: '📋', transcript: '📄', certificate: '🏆', report: '📝', other: '📁' };
const BACKEND = 'http://localhost:5001';

export default function DocumentReview() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [modal, setModal] = useState(null); // 'approve' | 'reject' | 'view'
  const [actionForm, setActionForm] = useState({ remarks: '', signatureText: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10, status: statusFilter });
      if (search) params.append('search', search);
      const { data } = await api.get(`/admin/documents?${params}`);
      setDocs(data.documents);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const openAction = (doc, type) => {
    setSelectedDoc(doc);
    setActionForm({ remarks: '', signatureText: 'Academic Administration' });
    setModal(type);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.put(`/admin/documents/${selectedDoc._id}/approve`, actionForm);
      toast.success('Document approved & signed! Email sent. ✅');
      setModal(null);
      fetchDocs();
    } catch (err) { toast.error(err.response?.data?.message || 'Approval failed'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!actionForm.remarks.trim()) { toast.error('Please provide a rejection reason'); return; }
    setActionLoading(true);
    try {
      await api.put(`/admin/documents/${selectedDoc._id}/reject`, { remarks: actionForm.remarks });
      toast.success('Document rejected. Student notified. ❌');
      setModal(null);
      fetchDocs();
    } catch (err) { toast.error(err.response?.data?.message || 'Rejection failed'); }
    finally { setActionLoading(false); }
  };

  const handleSetReview = async (docId) => {
    try {
      await api.put(`/admin/documents/${docId}/review`);
      toast.success('Marked as Under Review');
      fetchDocs();
    } catch { toast.error('Action failed'); }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/admin/documents/${doc._id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = doc.signedFileName || doc.fileName;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch { toast.error('Download failed'); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Document Requests</h1>
          <p>Review, approve, reject and digitally sign student certificates.</p>
        </div>

        {/* ── Filter Bar ── */}
        <div className="filter-bar">
          <div className="search-box">
            <FiSearch className="search-icon" size={16} />
            <input id="admin-doc-search" placeholder="Search by title, type..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select id="admin-status-filter" className="form-select" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="under_review">🔍 Under Review</option>
            <option value="approved">✅ Approved</option>
            <option value="rejected">❌ Rejected</option>
          </select>
          <button className="btn btn-outline btn-sm" onClick={fetchDocs}><FiRefreshCw size={14} /></button>
        </div>

        {/* ── Document Table ── */}
        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner-ring" style={{ margin: '0 auto' }} /></div>
          ) : docs.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📭</div><h3>No documents found</h3></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Student</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => (
                    <tr key={doc._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{DOC_ICON[doc.documentType]}</span>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(doc.fileSize / 1024).toFixed(1)} KB</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{doc.userId?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.userId?.rollNumber || doc.userId?.email}</div>
                      </td>
                      <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{doc.documentType}</td>
                      <td><StatusBadge status={doc.status} /></td>
                      <td style={{ fontSize: 12 }}>{new Date(doc.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {/* View Details Modal */}
                          <button
                            className="btn btn-outline btn-sm"
                            title="View Details"
                            onClick={() => { setSelectedDoc(doc); setModal('view'); }}
                          >
                            <FiEye size={13} />
                          </button>
                          {/* Open Certificate in New Tab */}
                          <a
                            href={`${BACKEND}${doc.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                            title="Open Certificate"
                            style={{ color: 'var(--accent)' }}
                          >
                            <FiExternalLink size={13} />
                          </a>
                          {/* Review Actions */}
                          {(doc.status === 'pending' || doc.status === 'under_review') && <>
                            {doc.status === 'pending' && (
                              <button className="btn btn-outline btn-sm" title="Mark Under Review" onClick={() => handleSetReview(doc._id)} style={{ color: 'var(--info)' }}>
                                🔍
                              </button>
                            )}
                            <button className="btn btn-success btn-sm" title="Approve & Sign" onClick={() => openAction(doc, 'approve')}>
                              <FiCheck size={13} />
                            </button>
                            <button className="btn btn-danger btn-sm" title="Reject" onClick={() => openAction(doc, 'reject')}>
                              <FiX size={13} />
                            </button>
                          </>}
                          {/* Download Signed */}
                          {doc.status === 'approved' && (
                            <button className="btn btn-success btn-sm" title="Download Signed PDF" onClick={() => handleDownload(doc)}>
                              <FiDownload size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════
            VIEW MODAL — Certificate Preview
        ════════════════════════════════════════ */}
        {modal === 'view' && selectedDoc && (
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📄 {selectedDoc.title}</h3>
                <button className="modal-close" onClick={() => setModal(null)}>✕</button>
              </div>
              <div className="modal-body">

                {/* Certificate Preview */}
                <div style={{ marginBottom: 16, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  {selectedDoc.mimeType === 'application/pdf' ? (
                    <iframe
                      src={`${BACKEND}${selectedDoc.fileUrl}`}
                      title="Certificate Preview"
                      style={{ width: '100%', height: 360, border: 'none', display: 'block' }}
                    />
                  ) : (
                    <img
                      src={`${BACKEND}${selectedDoc.fileUrl}`}
                      alt="Certificate Preview"
                      style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block', padding: 12 }}
                    />
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                  <a
                    href={`${BACKEND}${selectedDoc.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ color: 'var(--accent)' }}
                  >
                    <FiExternalLink size={13} /> Open in New Tab
                  </a>
                  {selectedDoc.status === 'approved' && selectedDoc.signedFileUrl && (
                    <a
                      href={`${BACKEND}${selectedDoc.signedFileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success btn-sm"
                    >
                      <FiDownload size={13} /> Download Signed PDF
                    </a>
                  )}
                </div>

                {/* Metadata */}
                <div style={{ display: 'grid', gap: 0 }}>
                  {[
                    ['Student',     selectedDoc.userId?.name],
                    ['Email',       selectedDoc.userId?.email],
                    ['Roll No.',    selectedDoc.userId?.rollNumber || '—'],
                    ['Department',  selectedDoc.userId?.department || '—'],
                    ['Type',        selectedDoc.documentType],
                    ['File Name',   selectedDoc.fileName],
                    ['File Size',   selectedDoc.fileSize ? `${(selectedDoc.fileSize / 1024).toFixed(1)} KB` : '—'],
                    ['Status',      <StatusBadge status={selectedDoc.status} />],
                    ['Description', selectedDoc.description || '—'],
                    ['Submitted',   new Date(selectedDoc.createdAt).toLocaleString('en-IN')],
                    selectedDoc.remarks    && ['Remarks',     selectedDoc.remarks],
                    selectedDoc.reviewedAt && ['Reviewed At', new Date(selectedDoc.reviewedAt).toLocaleString('en-IN')],
                    selectedDoc.signatureData?.signerName && ['Signed By', selectedDoc.signatureData.signerName],
                  ].filter(Boolean).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-muted)', minWidth: 110 }}>{k}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                {(selectedDoc.status === 'pending' || selectedDoc.status === 'under_review') && <>
                  <button className="btn btn-success btn-sm" onClick={() => setModal('approve')}>✅ Approve</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setModal('reject')}>❌ Reject</button>
                </>}
                <button className="btn btn-outline" onClick={() => setModal(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            APPROVE MODAL
        ════════════════════════════════════════ */}
        {modal === 'approve' && selectedDoc && (
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>✅ Approve & Sign Document</h3>
                <button className="modal-close" onClick={() => setModal(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">📄 Approving: <strong>{selectedDoc.title}</strong> by <strong>{selectedDoc.userId?.name}</strong></div>
                <div className="form-group">
                  <label className="form-label">Signature Text (Designation)</label>
                  <input className="form-input" value={actionForm.signatureText} onChange={e => setActionForm(p => ({ ...p, signatureText: e.target.value }))} placeholder="e.g. Academic Administration" />
                  <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>This will appear on the digital signature block added to the PDF.</small>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Remarks (Optional)</label>
                  <textarea className="form-textarea" value={actionForm.remarks} onChange={e => setActionForm(p => ({ ...p, remarks: e.target.value }))} placeholder="e.g. Approved for academic year 2024-25" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={handleApprove} disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : '✅ Approve & Sign'}
                </button>
                <button className="btn btn-outline" onClick={() => setModal(null)} disabled={actionLoading}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            REJECT MODAL
        ════════════════════════════════════════ */}
        {modal === 'reject' && selectedDoc && (
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>❌ Reject Document</h3>
                <button className="modal-close" onClick={() => setModal(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="alert alert-error">Rejecting: <strong>{selectedDoc.title}</strong> by <strong>{selectedDoc.userId?.name}</strong></div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Reason for Rejection *</label>
                  <textarea className="form-textarea" value={actionForm.remarks} onChange={e => setActionForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Explain why this document is being rejected..." rows={4} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-danger" onClick={handleReject} disabled={actionLoading}>
                  {actionLoading ? 'Processing...' : '❌ Confirm Rejection'}
                </button>
                <button className="btn btn-outline" onClick={() => setModal(null)} disabled={actionLoading}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
