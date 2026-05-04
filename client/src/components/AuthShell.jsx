const AuthShell = ({ eyebrow, title, description, children }) => {
  return (
    <div className="min-h-screen px-4 py-6 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl items-stretch gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:py-2">
        <section className="surface-panel relative overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.16),transparent_24%)]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-8">
              <div className="section-kicker w-fit">{eyebrow}</div>
              <div className="max-w-2xl space-y-5">
                <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {title}
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">{description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="metric-card">
                  <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Curated paths</p>
                  <p className="mt-2 text-sm text-slate-300">Every user lands on a role-specific flow with clear next steps.</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs uppercase tracking-[0.3em] text-gold">Fast entry</p>
                  <p className="mt-2 text-sm text-slate-300">One screen, one decision, fewer clicks to get into the right workspace.</p>
                </div>
                <div className="metric-card">
                  <p className="text-xs uppercase tracking-[0.3em] text-rose-300">Focused context</p>
                  <p className="mt-2 text-sm text-slate-300">The interface stays role-aware so each dashboard feels tailored.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
              <InfoBullet label="VC" description="Deal flow and portfolio tracking" />
              <InfoBullet label="Startup" description="Pitch, connect, and discover investors" />
              <InfoBullet label="Student" description="Mentorship and campus collaboration" />
            </div>
          </div>
        </section>

        <section className="surface-panel relative overflow-hidden p-4 sm:p-5 lg:p-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold via-teal to-rose" />
          <div className="relative h-full rounded-[1.5rem] border border-white/10 bg-slate-950/75 p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Secure entry</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Continue to your workspace</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                Role aware
              </span>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
};

const InfoBullet = ({ label, description }) => (
  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
    <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
  </div>
);

export default AuthShell;
