import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ACTION_CONFIG = {
  USER_REGISTERED: { icon: '🎉', bg: 'rgba(16,185,129,0.1)', label: 'Registered' },
  USER_LOGIN: { icon: '🔑', bg: 'rgba(99,102,241,0.1)', label: 'Login' },
  USER_LOGOUT: { icon: '👋', bg: 'rgba(100,116,139,0.1)', label: 'Logout' },
  DOCUMENT_UPLOADED: { icon: '📤', bg: 'rgba(6,182,212,0.1)', label: 'Upload' },
  DOCUMENT_APPROVED: { icon: '✅', bg: 'rgba(16,185,129,0.1)', label: 'Approved' },
  DOCUMENT_REJECTED: { icon: '❌', bg: 'rgba(239,68,68,0.1)', label: 'Rejected' },
  DOCUMENT_DOWNLOADED: { icon: '📥', bg: 'rgba(99,102,241,0.1)', label: 'Download' },
  DOCUMENT_DELETED: { icon: '🗑️', bg: 'rgba(239,68,68,0.1)', label: 'Deleted' },
  SIGNATURE_ADDED: { icon: '✍️', bg: 'rgba(139,92,246,0.1)', label: 'Signed' },
  EMAIL_SENT: { icon: '📧', bg: 'rgba(245,158,11,0.1)', label: 'Email' },
};

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-IN', { dateStyle: 'medium' });
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (actionFilter !== 'all') params.append('action', actionFilter);
      const { data } = await api.get(`/admin/audit-logs?${params}`);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [actionFilter]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Audit Logs</h1>
          <p>Complete trail of all actions performed in the system.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <select id="action-filter" className="form-select" style={{ width: 'auto' }} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="all">All Actions</option>
            {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
            ))}
          </select>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {pagination.total || 0} total events
          </div>

          {/* Action summary chips */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(ACTION_CONFIG).slice(0, 4).map(([key, cfg]) => (
              <button key={key} onClick={() => setActionFilter(actionFilter === key ? 'all' : key)}
                style={{
                  padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)',
                  background: actionFilter === key ? cfg.bg : 'transparent',
                  color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  transition: 'all 0.15s',
                }}>
                {cfg.icon} {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner-ring" style={{ margin: '0 auto' }} /></div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No logs found</h3>
              <p>No activity recorded for this filter.</p>
            </div>
          ) : (
            <>
              <div>
                {logs.map((log, idx) => {
                  const cfg = ACTION_CONFIG[log.action] || { icon: '📌', bg: 'rgba(100,116,139,0.1)', label: log.action };
                  return (
                    <div key={log._id} className="log-item">
                      <div className="log-icon" style={{ background: cfg.bg, fontSize: 18 }}>{cfg.icon}</div>
                      <div className="log-content">
                        <div className="log-action">
                          <span style={{ color: 'var(--primary-light)' }}>{log.userId?.name || 'System'}</span>
                          {' · '}
                          <span style={{ color: 'var(--text-secondary)' }}>{cfg.label}</span>
                          {log.documentId?.title && (
                            <span style={{ color: 'var(--text-muted)' }}> — {log.documentId.title}</span>
                          )}
                        </div>
                        <div className="log-detail">{log.details}</div>
                        <div className="log-time">
                          <span style={{ color: 'var(--text-muted)' }}>{timeAgo(log.createdAt)}</span>
                          {log.userId?.role && (
                            <span className={`badge badge-${log.userId.role}`} style={{ marginLeft: 8, fontSize: 10 }}>
                              {log.userId.role}
                            </span>
                          )}
                          {log.ipAddress && (
                            <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 11 }}>IP: {log.ipAddress}</span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {new Date(log.createdAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {pagination.pages > 1 && (
                <div className="pagination">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
                  {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
                    <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                  ))}
                  {pagination.pages > 7 && <span style={{ color: 'var(--text-muted)' }}>...</span>}
                  <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>›</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
