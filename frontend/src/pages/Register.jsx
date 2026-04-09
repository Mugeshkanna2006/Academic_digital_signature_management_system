import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiBook, FiHash, FiEye, FiEyeOff } from 'react-icons/fi';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', rollNumber: '', department: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        rollNumber: form.rollNumber,
        department: form.department,
      });
      login(data.user, data.token);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: 520 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">🎓</div>
          <h1>ADSMS</h1>
          <p>Create your student account</p>
        </div>

        <div className="auth-card">
          <h2>Create Account</h2>
          <p>Join ADSMS to manage your academic documents</p>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-group">
                <FiUser className="input-icon" size={16} />
                <input id="name" name="name" type="text" className="form-input" placeholder="John Doe" value={form.name} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-group">
                <FiMail className="input-icon" size={16} />
                <input id="reg-email" name="email" type="email" className="form-input" placeholder="your@email.com" value={form.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <div className="input-group">
                  <FiHash className="input-icon" size={16} />
                  <input id="rollNumber" name="rollNumber" type="text" className="form-input" placeholder="21CS001" value={form.rollNumber} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <div className="input-group">
                  <FiBook className="input-icon" size={16} />
                  <input id="department" name="department" type="text" className="form-input" placeholder="Computer Science" value={form.department} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-group" style={{ position: 'relative' }}>
                  <FiLock className="input-icon" size={16} />
                  <input id="reg-password" name="password" type={showPass ? 'text' : 'password'} className="form-input" placeholder="Min 6 chars" value={form.password} onChange={handleChange} required style={{ paddingRight: 42 }} />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-group">
                  <FiLock className="input-icon" size={16} />
                  <input id="confirmPassword" name="confirmPassword" type="password" className="form-input" placeholder="Repeat password" value={form.confirmPassword} onChange={handleChange} required />
                </div>
              </div>
            </div>

            <button id="register-btn" type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
              {loading ? <><span className="spinner-ring" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account...</> : '🚀 Create Account'}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          Already have an account?
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
