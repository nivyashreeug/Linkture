import { Link } from 'react-router-dom';

const roleStyles = {
  VC: 'from-teal-500/18 via-cyan-500/8 to-slate-950 border-teal-300/20',
  Startup: 'from-amber-500/18 via-orange-500/8 to-slate-950 border-amber-300/20',
  Student: 'from-rose-500/18 via-fuchsia-500/8 to-slate-950 border-rose-300/20',
};

const RoleCard = ({ role, title, description, to, accent }) => {
  return (
    <Link
      to={to}
      className={`group relative overflow-hidden rounded-[2rem] border bg-gradient-to-br p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_24px_80px_-36px_rgba(15,23,42,0.9)] ${roleStyles[role]}`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-80" />
      <div className="absolute -right-10 top-6 h-24 w-24 rounded-full bg-white/10 blur-3xl transition group-hover:scale-125" />
      <div className="flex items-center justify-between gap-4">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${accent}`}>
          {role}
        </span>
        <span className="text-sm text-slate-300 transition group-hover:translate-x-1 group-hover:text-white">Open portal →</span>
      </div>
      <h2 className="mt-6 font-display text-2xl font-bold text-white">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
      <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-400">
        <span className="h-px flex-1 bg-white/10" />
        <span>Tap to continue</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
    </Link>
  );
};

export default RoleCard;
