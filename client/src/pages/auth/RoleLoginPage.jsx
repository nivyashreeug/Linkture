import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/AuthShell';
import { useAuth } from '../../context/AuthContext';

const copy = {
  VC: {
    eyebrow: 'VC Login Portal',
    title: 'Sign in to source founders with precision.',
    description: 'Use the VC portal to access pipeline tracking, domain filters, and your investor dashboard.',
  },
  Startup: {
    eyebrow: 'Startup Login Portal',
    title: 'Sign in to share your deck and get discovered.',
    description: 'Use the startup portal to manage your pitch deck URL, company profile, and investor conversations.',
  },
  Student: {
    eyebrow: 'Student Login Portal',
    title: 'Sign in to connect with incubators and mentors.',
    description: 'Use the student portal to explore programs, collaboration opportunities, and profile visibility.',
  },
};

const RoleLoginPage = ({ role }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login({ ...formData, role });
      navigate(`/dashboard/${role.toLowerCase()}`);
    } catch (loginError) {
      setError(loginError.response?.data?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell {...copy[role]}>
      <div className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
            <input
              className="input-field"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <input
              className="input-field"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>
          {error ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          <button className="primary-button w-full" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : `Continue as ${role}`}
          </button>
        </form>

        <div className="flex items-center justify-between text-sm text-slate-400">
          <Link to="/" className="hover:text-white">
            Back to landing
          </Link>
          <Link to={`/register/${role.toLowerCase()}`} className="hover:text-white">
            Create account
          </Link>
          <span>Role locked: {role}</span>
        </div>
      </div>
    </AuthShell>
  );
};

export default RoleLoginPage;
