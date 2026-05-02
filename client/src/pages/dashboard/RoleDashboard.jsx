import { useAuth } from '../../context/AuthContext';

const titles = {
  VC: 'VC Dashboard',
  Startup: 'Startup Dashboard',
  Student: 'Student Dashboard',
};

const descriptions = {
  VC: 'Track domain interests, shortlist founders, and manage deal flow.',
  Startup: 'Manage pitch assets, investor outreach, and profile visibility.',
  Student: 'Coordinate incubator activity, mentors, and collaborative projects.',
};

const RoleDashboard = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{user.role}</p>
              <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">{titles[user.role]}</h1>
              <p className="mt-3 max-w-2xl text-slate-300">{descriptions[user.role]}</p>
            </div>
            <button className="ghost-button" onClick={logout} type="button">
              Logout
            </button>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="glass-panel rounded-[1.75rem] p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-teal-300">Identity</p>
            <p className="mt-3 text-lg font-semibold text-white">{user.fullName}</p>
            <p className="mt-2 text-sm text-slate-300">{user.email}</p>
          </div>
          <div className="glass-panel rounded-[1.75rem] p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-gold">Role Data</p>
            <p className="mt-3 text-lg font-semibold text-white">
              {user.role === 'VC'
                ? user.vcProfile?.domainInterests?.join(', ') || 'No interests yet'
                : user.role === 'Startup'
                  ? user.startupProfile?.pitchDeckUrl || 'No pitch deck yet'
                  : user.studentProfile?.incubatorName || 'No incubator yet'}
            </p>
            <p className="mt-2 text-sm text-slate-300">Role-specific profile data appears here.</p>
          </div>
          <div className="glass-panel rounded-[1.75rem] p-6">
            <p className="text-sm uppercase tracking-[0.3em] text-rose-300">Status</p>
            <p className="mt-3 text-lg font-semibold text-white">{user.isVerified ? 'Verified' : 'Pending verification'}</p>
            <p className="mt-2 text-sm text-slate-300">Use this area for notifications and workflow actions.</p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default RoleDashboard;
