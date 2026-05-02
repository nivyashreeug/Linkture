const AuthShell = ({ eyebrow, title, description, children }) => {
  return (
    <div className="min-h-screen px-4 py-8 text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.25em] text-slate-300">
            {eyebrow}
          </div>
          <div className="max-w-2xl space-y-5">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">{title}</h1>
            <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">{description}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass-panel rounded-3xl p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-teal-300">VCs</p>
              <p className="mt-2 text-sm text-slate-300">Track domain interest, stages, and startup deals in one place.</p>
            </div>
            <div className="glass-panel rounded-3xl p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-gold">Startups</p>
              <p className="mt-2 text-sm text-slate-300">Share your pitch deck and get discovered by aligned investors.</p>
            </div>
            <div className="glass-panel rounded-3xl p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-rose-300">Students</p>
              <p className="mt-2 text-sm text-slate-300">Connect incubators, mentors, and early founders.</p>
            </div>
          </div>
        </div>
        <div className="glass-panel rounded-[2rem] p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
};

export default AuthShell;
