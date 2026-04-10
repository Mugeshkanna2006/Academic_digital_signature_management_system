import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { FiUpload, FiFileText, FiCheckCircle, FiClock, FiXCircle, FiDownload } from 'react-icons/fi';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('documents/my?limit=5').then(({ data }) => {
      setDocs(data.documents || []);
    }).finally(() => setLoading(false));
  }, []);

  const counts = {
    total: docs.length,
    pending: docs.filter(d => d.status === 'pending').length,
    approved: docs.filter(d => d.status === 'approved').length,
    rejected: docs.filter(d => d.status === 'rejected').length,
  };

  const handleDownload = async (docId, fileName) => {
    try {
      const res = await api.get(`documents/${docId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Download failed');
    }
  };

  const docTypeIcon = type => ({ bonafide: '📋', transcript: '📄', certificate: '🏆', report: '📝', other: '📁' })[type] || '📁';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p>Track your document requests and download signed files from here.</p>
        </div>

        <div className="stats-grid">
          {[
            { label: 'Total Documents', value: counts.total, icon: '📂', cls: 'purple' },
            { label: 'Pending Review', value: counts.pending, icon: '⏳', cls: 'yellow' },
            { label: 'Approved & Signed', value: counts.approved, icon: '✅', cls: 'green' },
            { label: 'Rejected', value: counts.rejected, icon: '❌', cls: 'red' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
              <div className="stat-info">
                <p>{s.label}</p>
                <h3>{s.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div>
              <h2>Quick Actions</h2>
              <p>Manage your academic documents</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/upload" className="btn btn-primary">
              <FiUpload size={16} /> Upload Document
            </Link>
            <Link to="/my-documents" className="btn btn-outline">
              <FiFileText size={16} /> View All Documents
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2>Recent Documents</h2>
              <p>Your latest 5 submissions</p>
            </div>
            <Link to="/my-documents" className="btn btn-outline btn-sm">View All</Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="spinner-ring" style={{ margin: '0 auto' }} />
            </div>
          ) : docs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No documents yet</h3>
              <p>Upload your first document to get started</p>
              <Link to="/upload" className="btn btn-primary">Upload Now</Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => (
                    <tr key={doc._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>{docTypeIcon(doc.documentType)}</span>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{doc.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(doc.fileSize / 1024).toFixed(1)} KB</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{doc.documentType}</td>
                      <td><StatusBadge status={doc.status} /></td>
                      <td>{new Date(doc.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>
                        {doc.status === 'approved' && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleDownload(doc._id, doc.signedFileName || doc.fileName)}
                          >
                            <FiDownload size={13} /> Download
                          </button>
                        )}
                        {doc.status === 'rejected' && doc.remarks && (
                          <span style={{ fontSize: 11, color: 'var(--danger)' }} title={doc.remarks}>
                            View Remarks
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
