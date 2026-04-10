import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import StatusBadge from '../../components/StatusBadge';
import api from '../../api/axios';
import { FiFileText, FiUsers, FiActivity, FiClock, FiCheckCircle, FiXCircle, FiEye } from 'react-icons/fi';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('admin/stats').then(({ data }) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="loading-screen" style={{ minHeight: '60vh' }}>
          <div className="spinner-ring" /><p>Loading dashboard...</p>
        </div>
      </main>
    </div>
  );

  const s = stats?.stats || {};
  const recent = stats?.recentDocuments || [];

  const statCards = [
    { label: 'Total Documents', value: s.total || 0, icon: '📂', cls: 'purple', link: '/admin/documents' },
    { label: 'Pending Review', value: s.pending || 0, icon: '⏳', cls: 'yellow', link: '/admin/documents?status=pending' },
    { label: 'Under Review', value: s.underReview || 0, icon: '🔍', cls: 'blue', link: '/admin/documents?status=under_review' },
    { label: 'Approved', value: s.approved || 0, icon: '✅', cls: 'green', link: '/admin/documents?status=approved' },
    { label: 'Rejected', value: s.rejected || 0, icon: '❌', cls: 'red', link: '/admin/documents?status=rejected' },
    { label: 'Total Students', value: s.totalStudents || 0, icon: '🎓', cls: 'cyan', link: '/admin/students' },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Admin Dashboard 🛡️</h1>
          <p>Overview of document requests and system activity.</p>
        </div>

        <div className="stats-grid">
          {statCards.map(sc => (
            <Link to={sc.link} key={sc.label} className="stat-card" style={{ textDecoration: 'none' }}>
              <div className={`stat-icon ${sc.cls}`}>{sc.icon}</div>
              <div className="stat-info">
                <p>{sc.label}</p>
                <h3>{sc.value}</h3>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          <div className="card">
            <div className="card-header">
              <div><h2>Recent Requests</h2><p>Latest document submissions</p></div>
              <Link to="/admin/documents" className="btn btn-outline btn-sm">View All</Link>
            </div>

            {recent.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-icon">📭</div>
                <h3>No documents yet</h3>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Document</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map(doc => (
                      <tr key={doc._id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{doc.userId?.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{doc.userId?.email}</div>
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</td>
                        <td style={{ textTransform: 'capitalize', fontSize: 12 }}>{doc.documentType}</td>
                        <td><StatusBadge status={doc.status} /></td>
                        <td style={{ fontSize: 12 }}>{new Date(doc.createdAt).toLocaleDateString('en-IN')}</td>
                        <td>
                          <Link to="/admin/documents" className="btn btn-outline btn-sm">
                            <FiEye size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⚡ Quick Actions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link to="/admin/documents?status=pending" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                  <FiClock size={15} /> Review Pending ({s.pending || 0})
                </Link>
                <Link to="/admin/students" className="btn btn-outline" style={{ justifyContent: 'center' }}>
                  <FiUsers size={15} /> Manage Students
                </Link>
                <Link to="/admin/audit-logs" className="btn btn-outline" style={{ justifyContent: 'center' }}>
                  <FiActivity size={15} /> View Audit Logs
                </Link>
              </div>
            </div>

            <div className="card">
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📊 Status Breakdown</h2>
              {[
                { label: 'Pending', value: s.pending || 0, total: s.total || 1, color: 'var(--warning)' },
                { label: 'Approved', value: s.approved || 0, total: s.total || 1, color: 'var(--success)' },
                { label: 'Rejected', value: s.rejected || 0, total: s.total || 1, color: 'var(--danger)' },
                { label: 'Under Review', value: s.underReview || 0, total: s.total || 1, color: 'var(--info)' },
              ].map(b => (
                <div key={b.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{b.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{b.value} / {s.total || 0}</span>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((b.value / (s.total || 1)) * 100)}%`, height: '100%', background: b.color, borderRadius: 6, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
