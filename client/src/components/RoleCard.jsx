import { Link } from 'react-router-dom';

const roleStyles = {
  VC: 'from-teal-500/20 to-cyan-500/10 border-teal-400/20',
  Startup: 'from-amber-500/20 to-orange-500/10 border-amber-400/20',
  Student: 'from-rose-500/20 to-fuchsia-500/10 border-rose-400/20',
};

const RoleCard = ({ role, title, description, to, accent }) => {
  return (
    <Link
      to={to}
      className={`group rounded-[1.75rem] border bg-gradient-to-br p-6 transition duration-300 hover:-translate-y-1 hover:shadow-2xl ${roleStyles[role]}`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] ${accent}`}>
          {role}
        </span>
        <span className="text-sm text-slate-300 transition group-hover:translate-x-1">Open portal</span>
      </div>
      <h2 className="mt-6 font-display text-2xl font-bold text-white">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
    </Link>
  );
};

export default RoleCard;
