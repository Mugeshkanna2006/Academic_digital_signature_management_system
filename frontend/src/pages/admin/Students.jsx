import { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FiSearch, FiUser, FiMail, FiBook, FiHash } from 'react-icons/fi';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12 });
      if (search) params.append('search', search);
      const { data } = await api.get(`/admin/students?${params}`);
      setStudents(data.students);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { setPage(1); }, [search]);

  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  const DEPT_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
  const deptColor = (dept) => DEPT_COLORS[(dept || '').length % DEPT_COLORS.length];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Students</h1>
          <p>View all registered students and their document activity.</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div className="search-box" style={{ maxWidth: 360, flex: 1 }}>
            <FiSearch className="search-icon" size={16} />
            <input id="student-search" placeholder="Search by name, email, roll no..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {pagination.total || 0} students registered
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner-ring" style={{ margin: '0 auto' }} /></div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No students found</h3>
            <p>{search ? 'Try a different search.' : 'No students have registered yet.'}</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {students.map(student => (
                <div key={student._id} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setSelectedStudent(student)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${deptColor(student.department)}, ${deptColor(student.name)})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 18, color: 'white', flexShrink: 0,
                    }}>
                      {initials(student.name)}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { icon: '📋', label: 'Roll No', value: student.rollNumber || '—' },
                      { icon: '🏛️', label: 'Dept', value: student.department || '—' },
                      { icon: '📂', label: 'Documents', value: student.documentCount || 0 },
                      { icon: '📅', label: 'Joined', value: new Date(student.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) },
                    ].map(item => (
                      <div key={item.label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{item.icon} {item.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</div>
                      </div>
                    ))}
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

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>👤 Student Profile</h3>
                <button className="modal-close" onClick={() => setSelectedStudent(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${deptColor(selectedStudent.department)}, ${deptColor(selectedStudent.name)})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 26, color: 'white', margin: '0 auto 12px',
                  }}>{initials(selectedStudent.name)}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedStudent.name}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{selectedStudent.email}</div>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    ['📋 Roll Number', selectedStudent.rollNumber || '—'],
                    ['🏛️ Department', selectedStudent.department || '—'],
                    ['📂 Total Documents', selectedStudent.documentCount || 0],
                    ['📅 Registered On', new Date(selectedStudent.createdAt).toLocaleString('en-IN')],
                    ['🕐 Last Login', selectedStudent.lastLogin ? new Date(selectedStudent.lastLogin).toLocaleString('en-IN') : 'Never'],
                    ['✅ Account Status', selectedStudent.isActive ? '🟢 Active' : '🔴 Deactivated'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-muted)', minWidth: 140 }}>{k}</span>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setSelectedStudent(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
