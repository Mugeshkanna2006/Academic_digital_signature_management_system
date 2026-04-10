import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('auth/login', form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <div className="auth-logo-icon">🎓</div>
          <h1>ADSMS</h1>
          <p>Academic Digital Signature System</p>
        </div>

        <div className="auth-card">
          <h2>Welcome back</h2>
          <p>Sign in to your account to continue</p>

          {error && (
            <div className="alert alert-error">⚠️ {error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-group">
                <FiMail className="input-icon" size={16} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-group" style={{ position: 'relative' }}>
                <FiLock className="input-icon" size={16} />
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 42 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? <><span className="spinner-ring" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : '🔐 Sign In'}
            </button>
          </form>

          <div className="auth-divider">OR</div>

          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: 14, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            💡 Demo Admin: <strong style={{ color: 'var(--primary-light)' }}>admin@adsms.com</strong> / <strong style={{ color: 'var(--primary-light)' }}>admin123</strong>
          </div>
        </div>

        <div className="auth-footer">
          Don't have an account?
          <Link to="/register">Create one here</Link>
        </div>
      </div>
    </div>
  );
}
