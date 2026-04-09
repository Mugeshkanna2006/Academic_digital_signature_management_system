import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import StatusBadge from '../../components/StatusBadge';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiSearch, FiDownload, FiTrash2, FiEye, FiUpload } from 'react-icons/fi';

const DOC_ICON = { bonafide: '📋', transcript: '📄', certificate: '🏆', report: '📝', other: '📁' };

export default function MyDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedDoc, setSelectedDoc] = useState(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 9, status: statusFilter });
      if (search) params.append('search', search);
      const { data } = await api.get(`/documents/my?${params}`);
      setDocs(data.documents);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc._id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.signedFileName || doc.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started!');
    } catch { toast.error('Download failed'); }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Delete this document?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      toast.success('Document deleted');
      fetchDocs();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>My Documents</h1>
          <p>View and manage all your document submissions.</p>
        </div>

        <div className="filter-bar">
          <div className="search-box">
            <FiSearch className="search-icon" size={16} />
            <input id="doc-search" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select id="status-filter" className="form-select" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">⏳ Pending</option>
            <option value="under_review">🔍 Under Review</option>
            <option value="approved">✅ Approved</option>
            <option value="rejected">❌ Rejected</option>
          </select>
          <Link to="/upload" className="btn btn-primary btn-sm"><FiUpload size={14} /> Upload New</Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner-ring" style={{ margin: '0 auto' }} /></div>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No documents found</h3>
            <p>{search ? 'Try a different search term.' : 'Upload your first document to get started.'}</p>
            <Link to="/upload" className="btn btn-primary">Upload Document</Link>
          </div>
        ) : (
          <>
            <div className="doc-grid">
              {docs.map(doc => (
                <div key={doc._id} className={`doc-card ${doc.status}`}>
                  <div className="doc-card-header">
                    <div className="doc-icon">{DOC_ICON[doc.documentType]}</div>
                    <StatusBadge status={doc.status} />
                  </div>
                  <div className="doc-card-title">{doc.title}</div>
                  <div className="doc-card-type">{doc.documentType}</div>
                  <div className="doc-card-meta" style={{ marginTop: 10 }}>
                    <div className="doc-meta-item">📅 {new Date(doc.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                    <div className="doc-meta-item">📦 {(doc.fileSize / 1024).toFixed(1)} KB</div>
                    {doc.remarks && <div className="doc-meta-item" style={{ color: doc.status === 'rejected' ? 'var(--danger)' : 'var(--text-muted)' }}>💬 {doc.remarks}</div>}
                    {doc.reviewedBy && <div className="doc-meta-item">👤 Reviewed by {doc.reviewedBy.name}</div>}
                  </div>
                  <div className="doc-card-actions">
                    <button className="btn btn-outline btn-sm" onClick={() => setSelectedDoc(doc)}>
                      <FiEye size={13} /> Details
                    </button>
                    {doc.status === 'approved' && (
                      <button className="btn btn-success btn-sm" onClick={() => handleDownload(doc)}>
                        <FiDownload size={13} /> Download
                      </button>
                    )}
                    {doc.status === 'pending' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(doc._id)}>
                        <FiTrash2 size={13} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>›</button>
              </div>
            )}
          </>
        )}

        {/* Detail Modal */}
        {selectedDoc && (
          <div className="modal-overlay" onClick={() => setSelectedDoc(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📄 Document Details</h3>
                <button className="modal-close" onClick={() => setSelectedDoc(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'grid', gap: 14 }}>
                  {[
                    ['Title', selectedDoc.title],
                    ['Type', selectedDoc.documentType],
                    ['Status', <StatusBadge status={selectedDoc.status} />],
                    ['File', selectedDoc.fileName],
                    ['Size', `${(selectedDoc.fileSize / 1024).toFixed(1)} KB`],
                    ['Submitted', new Date(selectedDoc.createdAt).toLocaleString('en-IN')],
                    selectedDoc.reviewedAt && ['Reviewed', new Date(selectedDoc.reviewedAt).toLocaleString('en-IN')],
                    selectedDoc.reviewedBy && ['Reviewed By', selectedDoc.reviewedBy.name],
                    selectedDoc.remarks && ['Remarks', selectedDoc.remarks],
                    selectedDoc.signatureData?.signerName && ['Signed By', selectedDoc.signatureData.signerName],
                  ].filter(Boolean).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', minWidth: 110 }}>{k}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                {selectedDoc.status === 'approved' && (
                  <button className="btn btn-success" onClick={() => { handleDownload(selectedDoc); setSelectedDoc(null); }}>
                    <FiDownload size={15} /> Download Signed
                  </button>
                )}
                <button className="btn btn-outline" onClick={() => setSelectedDoc(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
