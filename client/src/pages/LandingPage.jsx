import { Link } from 'react-router-dom';
import RoleCard from '../components/RoleCard';

const LandingPage = () => {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col justify-center gap-8">
        <section className="surface-panel relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.15),transparent_30%),radial-gradient(circle_at_top_right,rgba(20,184,166,0.16),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
          <div className="relative grid gap-10 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-12">
            <div className="max-w-3xl space-y-7">
              <div className="section-kicker w-fit">Linkture workspace</div>
              <div className="space-y-5">
                <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl">
                  A sharper entrance for investors, founders, and students.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  A more editorial landing experience that keeps the same role-based routes, but presents them as a
                  premium product with clearer hierarchy, stronger contrast, and faster decision-making.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link className="primary-button" to="/login/vc">
                  Enter as VC
                </Link>
                <a className="ghost-button" href="#roles">
                  Explore roles
                </a>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="metric-card">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Role aware</p>
                  <p className="mt-2 text-2xl font-bold text-white">3</p>
                  <p className="mt-1 text-sm text-slate-300">Distinct flows for each user type.</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Less friction</p>
                  <p className="mt-2 text-2xl font-bold text-white">1</p>
                  <p className="mt-1 text-sm text-slate-300">Clear landing point to get started faster.</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Consistent UI</p>
                  <p className="mt-2 text-2xl font-bold text-white">All</p>
                  <p className="mt-1 text-sm text-slate-300">A unified style across auth and dashboards.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-slate-950/75 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">How it works</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Choose your lane</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                  3 routes
                </span>
              </div>

              <div className="grid gap-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-semibold text-white">1. Pick a role</p>
                  <p className="mt-2 leading-6">VC, Startup, or Student. The app routes you to a dedicated sign-in flow.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-semibold text-white">2. Sign in or register</p>
                  <p className="mt-2 leading-6">The form shell stays focused and minimal so the next step is obvious.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="font-semibold text-white">3. Reach your dashboard</p>
                  <p className="mt-2 leading-6">Each workspace keeps the same visual language while surfacing role-specific actions.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="roles" className="grid gap-5 lg:grid-cols-3">
          <RoleCard
            role="VC"
            title="Venture Capital portal"
            description="Enter with a VC-specific login and focus on domain interests, investment stage, and pipeline discovery."
            to="/login/vc"
            accent="border-teal-400/30 text-teal-200"
          />
          <RoleCard
            role="Startup"
            title="Startup founder portal"
            description="Sign in as a startup, showcase your pitch deck URL, and connect with aligned investors."
            to="/login/startup"
            accent="border-amber-400/30 text-amber-200"
          />
          <RoleCard
            role="Student"
            title="Student incubator portal"
            description="Join as a student or incubator to build visibility, mentorship, and early-stage collaboration."
            to="/login/student"
            accent="border-rose-400/30 text-rose-200"
          />
        </section>
      </div>
    </main>
  );
};

export default LandingPage;
