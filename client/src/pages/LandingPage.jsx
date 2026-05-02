import RoleCard from '../components/RoleCard';

const LandingPage = () => {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center gap-10">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 px-6 py-10 shadow-glow backdrop-blur-xl sm:px-10 sm:py-14">
          <div className="absolute inset-0 bg-hero-grid bg-[length:32px_32px] opacity-30" />
          <div className="relative max-w-3xl space-y-6">
            <div className="inline-flex rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-gold">
              Linkture
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl">
              One networking platform for capital, builders, and talent.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              A shared landing experience that routes Venture Capitalists, Startup Owners, and Student Incubators into
              their own login flows and role-specific dashboards.
            </p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
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
