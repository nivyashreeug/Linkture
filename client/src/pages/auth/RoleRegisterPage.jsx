import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../../components/AuthShell';
import { useAuth } from '../../context/AuthContext';

const copy = {
  VC: {
    eyebrow: 'VC Registration Portal',
    title: 'Create an investor profile with your focus areas.',
    description: 'Set up your VC account, define your domain interests, and start discovering relevant startups.',
  },
  Startup: {
    eyebrow: 'Startup Registration Portal',
    title: 'Create a founder profile and upload your pitch deck.',
    description: 'Set up your startup account with your company details and pitch deck URL for investor discovery.',
  },
  Student: {
    eyebrow: 'Student Registration Portal',
    title: 'Create a student or incubator profile.',
    description: 'Join the platform and position your profile for mentorship, projects, and early-stage collaboration.',
  },
};

const initialRoleState = {
  VC: {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatarUrl: '',
    bio: '',
    location: '',
    domainInterests: '',
    investmentStage: '',
    preferredRegions: '',
    ticketSizeMin: '',
    ticketSizeMax: '',
    portfolioCount: '',
  },
  Startup: {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatarUrl: '',
    bio: '',
    location: '',
    companyName: '',
    startupStage: 'Idea',
    pitchDeckUrl: '',
    websiteUrl: '',
    industry: '',
    foundingYear: '',
    teamSize: '',
  },
  Student: {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatarUrl: '',
    bio: '',
    location: '',
    institutionName: '',
    program: '',
    graduationYear: '',
    incubatorName: '',
    skills: '',
    projectLinks: '',
  },
};

const parseCsv = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const RoleRegisterPage = ({ role }) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState(initialRoleState[role]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleSpecificFields = useMemo(() => {
    if (role === 'VC') {
      return (
        <>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Domain interests</label>
            <input
              className="input-field"
              name="domainInterests"
              value={formData.domainInterests}
              onChange={handleChange}
              placeholder="FinTech, HealthTech, SaaS"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Investment stage</label>
              <input
                className="input-field"
                name="investmentStage"
                value={formData.investmentStage}
                onChange={handleChange}
                placeholder="Seed, Series A"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Preferred regions</label>
              <input
                className="input-field"
                name="preferredRegions"
                value={formData.preferredRegions}
                onChange={handleChange}
                placeholder="India, US, Europe"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Min ticket size</label>
              <input className="input-field" type="number" name="ticketSizeMin" value={formData.ticketSizeMin} onChange={handleChange} min="0" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Max ticket size</label>
              <input className="input-field" type="number" name="ticketSizeMax" value={formData.ticketSizeMax} onChange={handleChange} min="0" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Portfolio count</label>
              <input className="input-field" type="number" name="portfolioCount" value={formData.portfolioCount} onChange={handleChange} min="0" />
            </div>
          </div>
        </>
      );
    }

    if (role === 'Startup') {
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Company name</label>
              <input className="input-field" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Linkture Labs" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Startup stage</label>
              <select className="input-field" name="startupStage" value={formData.startupStage} onChange={handleChange}>
                <option>Idea</option>
                <option>MVP</option>
                <option>Pre-Seed</option>
                <option>Seed</option>
                <option>Series A</option>
                <option>Series B+</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Pitch deck URL</label>
            <input className="input-field" name="pitchDeckUrl" value={formData.pitchDeckUrl} onChange={handleChange} placeholder="https://..." required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Website URL</label>
              <input className="input-field" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} placeholder="https://yourstartup.com" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Industry</label>
              <input className="input-field" name="industry" value={formData.industry} onChange={handleChange} placeholder="EdTech, AI, Climate" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Founding year</label>
              <input className="input-field" type="number" name="foundingYear" value={formData.foundingYear} onChange={handleChange} min="1900" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Team size</label>
              <input className="input-field" type="number" name="teamSize" value={formData.teamSize} onChange={handleChange} min="1" />
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Institution name</label>
            <input className="input-field" name="institutionName" value={formData.institutionName} onChange={handleChange} placeholder="University / Incubator" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Program</label>
            <input className="input-field" name="program" value={formData.program} onChange={handleChange} placeholder="B.Tech, MBA, Fellowship" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Graduation year</label>
            <input className="input-field" type="number" name="graduationYear" value={formData.graduationYear} onChange={handleChange} min="1900" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Incubator name</label>
            <input className="input-field" name="incubatorName" value={formData.incubatorName} onChange={handleChange} placeholder="Student Incubator / Club" />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Skills</label>
          <input className="input-field" name="skills" value={formData.skills} onChange={handleChange} placeholder="Design, AI, Product" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Project links</label>
          <input className="input-field" name="projectLinks" value={formData.projectLinks} onChange={handleChange} placeholder="https://github.com/..., https://demo..." />
        </div>
      </>
    );
  }, [formData, role]);

  function handleChange(event) {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role,
        avatarUrl: formData.avatarUrl || undefined,
        bio: formData.bio || undefined,
        location: formData.location || undefined,
      };

      if (role === 'VC') {
        payload.domainInterests = parseCsv(formData.domainInterests);
        payload.investmentStage = parseCsv(formData.investmentStage);
        payload.preferredRegions = parseCsv(formData.preferredRegions);
        payload.ticketSizeMin = formData.ticketSizeMin ? Number(formData.ticketSizeMin) : undefined;
        payload.ticketSizeMax = formData.ticketSizeMax ? Number(formData.ticketSizeMax) : undefined;
        payload.portfolioCount = formData.portfolioCount ? Number(formData.portfolioCount) : undefined;
      }

      if (role === 'Startup') {
        payload.companyName = formData.companyName;
        payload.startupStage = formData.startupStage;
        payload.pitchDeckUrl = formData.pitchDeckUrl;
        payload.websiteUrl = formData.websiteUrl || undefined;
        payload.industry = formData.industry || undefined;
        payload.foundingYear = formData.foundingYear ? Number(formData.foundingYear) : undefined;
        payload.teamSize = formData.teamSize ? Number(formData.teamSize) : undefined;
      }

      if (role === 'Student') {
        payload.institutionName = formData.institutionName || undefined;
        payload.program = formData.program || undefined;
        payload.graduationYear = formData.graduationYear ? Number(formData.graduationYear) : undefined;
        payload.incubatorName = formData.incubatorName || undefined;
        payload.skills = parseCsv(formData.skills);
        payload.projectLinks = parseCsv(formData.projectLinks);
      }

      await register(payload);
      navigate(`/dashboard/${role.toLowerCase()}`);
    } catch (registerError) {
      setError(registerError.response?.data?.message || 'Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell {...copy[role]}>
      <div className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Full name</label>
              <input className="input-field" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Your name" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
              <input className="input-field" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
              <input className="input-field" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a password" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Confirm password</label>
              <input className="input-field" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" required />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Avatar URL</label>
              <input className="input-field" name="avatarUrl" value={formData.avatarUrl} onChange={handleChange} placeholder="https://..." />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Location</label>
              <input className="input-field" name="location" value={formData.location} onChange={handleChange} placeholder="City, Country" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Bio</label>
            <textarea className="input-field min-h-[110px] resize-y" name="bio" value={formData.bio} onChange={handleChange} placeholder="Short profile summary" />
          </div>

          {roleSpecificFields}

          {error ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}
          <button className="primary-button w-full" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : `Create ${role} account`}
          </button>
        </form>

        <div className="flex items-center justify-between text-sm text-slate-400">
          <Link to={`/login/${role.toLowerCase()}`} className="hover:text-white">
            Already have an account?
          </Link>
          <Link to="/" className="hover:text-white">
            Back to landing
          </Link>
        </div>
      </div>
    </AuthShell>
  );
};

export default RoleRegisterPage;
