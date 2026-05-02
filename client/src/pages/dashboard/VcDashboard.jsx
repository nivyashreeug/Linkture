import { useEffect, useMemo, useState } from 'react';
import {
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const domainColors = {
	FinTech: '#2dd4bf',
	SaaS: '#f59e0b',
	HealthTech: '#fb7185',
	EdTech: '#a78bfa',
	Climate: '#4ade80',
	AI: '#38bdf8',
};

const cx = (...classes) => classes.filter(Boolean).join(' ');

const VcDashboard = () => {
	const { user, logout } = useAuth();
	const [dashboardData, setDashboardData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [selectedDomains, setSelectedDomains] = useState(user?.vcProfile?.domainInterests?.length ? user.vcProfile.domainInterests : []);

	useEffect(() => {
		const fetchDashboard = async () => {
			try {
				setLoading(true);
				const response = await api.get('/users/vc/dashboard');
				setDashboardData(response.data.data);
				setSelectedDomains(response.data.data.selectedDomains);
				setError('');
			} catch (fetchError) {
				setError(fetchError.response?.data?.message || 'Unable to load VC dashboard data.');
			} finally {
				setLoading(false);
			}
		};

		if (user?.role === 'VC') {
			fetchDashboard();
		}
	}, [user]);

	const matchingStartups = useMemo(() => {
		if (!dashboardData?.startupFeed?.length) {
			return [];
		}

		return dashboardData.startupFeed.filter((startup) => !selectedDomains.length || selectedDomains.includes(startup.domain));
	}, [dashboardData, selectedDomains]);

	const investmentDomains = dashboardData?.investmentDomains || [];
	const marketTrends = dashboardData?.marketTrends || [];

	const portfolioDistribution = useMemo(() => {
		if (!dashboardData?.portfolioCompanies?.length) {
			return [];
		}

		const source = selectedDomains.length
			? dashboardData.portfolioCompanies.filter((company) => selectedDomains.includes(company.domain))
			: dashboardData.portfolioCompanies;

		return (dashboardData.investmentDomains || []).map((domain) => ({
			name: domain,
			value: source
				.filter((company) => company.domain === domain)
				.reduce((sum, company) => sum + company.allocation, 0),
		})).filter((entry) => entry.value > 0);
	}, [dashboardData, selectedDomains]);

	const visibleTrendKeys = selectedDomains.length ? selectedDomains : investmentDomains;

	const handleDomainChange = (event) => {
		const values = Array.from(event.target.selectedOptions, (option) => option.value);
		setSelectedDomains(values);
	};

	const clearFilters = () => setSelectedDomains([]);

	if (!user) {
		return null;
	}

	if (loading) {
		return (
			<main className="flex min-h-screen items-center justify-center px-4 text-slate-300">
				Loading VC dashboard...
			</main>
		);
	}

	if (error) {
		return (
			<main className="flex min-h-screen items-center justify-center px-4">
				<div className="glass-panel max-w-lg rounded-[2rem] p-6 text-center">
					<h2 className="font-display text-2xl font-bold text-white">Unable to load dashboard</h2>
					<p className="mt-3 text-slate-300">{error}</p>
					<button className="primary-button mt-6" type="button" onClick={() => window.location.reload()}>
						Retry
					</button>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
			<div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
				<aside className="glass-panel rounded-[2rem] p-5 lg:sticky lg:top-6 lg:h-fit">
					<div className="space-y-4">
						<div>
							<p className="text-xs uppercase tracking-[0.3em] text-slate-400">VC Workspace</p>
							<h1 className="mt-2 font-display text-3xl font-bold text-white">{user.fullName}</h1>
							<p className="mt-2 text-sm text-slate-300">Filter deal flow by your preferred investment domains.</p>
						</div>

						<div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
							<div className="mb-3 flex items-center justify-between gap-3">
								<label className="text-sm font-semibold text-white">Investment Domain</label>
								<button className="text-xs font-semibold uppercase tracking-[0.24em] text-gold transition hover:text-amber-300" type="button" onClick={clearFilters}>
									Clear
								</button>
							</div>
							<select
								multiple
								value={selectedDomains}
								onChange={handleDomainChange}
								className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-3 text-sm text-slate-100 outline-none ring-0 focus:border-gold/70"
							>
								{investmentDomains.map((domain) => (
									<option key={domain} value={domain} className="bg-slate-950 text-slate-100">
										{domain}
									</option>
								))}
							</select>
							<p className="mt-3 text-xs leading-5 text-slate-400">
								Hold Ctrl on Windows or Command on Mac to select multiple domains.
							</p>
						</div>

						<div className="rounded-3xl border border-white/10 bg-white/5 p-4">
							<p className="text-xs uppercase tracking-[0.28em] text-teal-300">Active filters</p>
							<div className="mt-3 flex flex-wrap gap-2">
								{selectedDomains.length ? (
									selectedDomains.map((domain) => (
										<span key={domain} className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
											{domain}
										</span>
									))
								) : (
									<span className="text-sm text-slate-400">No filter selected, showing all startups.</span>
								)}
							</div>
						</div>

						<button className="ghost-button w-full" type="button" onClick={logout}>
							Logout
						</button>
					</div>
				</aside>

				<section className="space-y-6">
					<header className="glass-panel rounded-[2rem] p-6 sm:p-8">
						<div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
							<div className="max-w-3xl space-y-4">
								<p className="text-sm uppercase tracking-[0.3em] text-slate-400">Investor dashboard</p>
								<h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
									View market momentum, portfolio spread, and curated startups in one place.
								</h2>
								<p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
									The charts and feed update based on the selected investment domains so you can focus on relevant
									opportunities faster.
								</p>
							</div>
							<div className="grid gap-3 sm:grid-cols-3 xl:w-[30rem]">
								<StatCard label="Selected domains" value={selectedDomains.length || investmentDomains.length} />
								<StatCard label="Matched startups" value={matchingStartups.length} />
								<StatCard label="Portfolio companies" value={portfolioDistribution.length} />
							</div>
						</div>
					</header>

					<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
						<div className="glass-panel rounded-[2rem] p-5 sm:p-6">
							<div className="mb-5 flex items-center justify-between gap-3">
								<div>
									<p className="text-xs uppercase tracking-[0.28em] text-gold">Market trends</p>
									<h3 className="mt-1 text-xl font-semibold text-white">Momentum by investment domain</h3>
								</div>
								<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
									Recharts line chart
								</span>
							</div>
							<div className="h-[320px]">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={marketTrends} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
										<CartesianGrid stroke="rgba(148, 163, 184, 0.16)" strokeDasharray="4 4" />
										<XAxis dataKey="month" stroke="#94a3b8" />
										<YAxis stroke="#94a3b8" />
										<Tooltip
											contentStyle={{
												background: 'rgba(2, 6, 23, 0.95)',
												border: '1px solid rgba(255,255,255,0.1)',
												borderRadius: '16px',
												color: '#e2e8f0',
											}}
										/>
										<Legend />
										{visibleTrendKeys.map((domain) => (
											<Line key={domain} type="monotone" dataKey={domain} stroke={domainColors[domain]} strokeWidth={3} dot={false} />
										))}
									</LineChart>
								</ResponsiveContainer>
							</div>
						</div>

						<div className="glass-panel rounded-[2rem] p-5 sm:p-6">
							<div className="mb-5">
								<p className="text-xs uppercase tracking-[0.28em] text-teal-300">Portfolio distribution</p>
								<h3 className="mt-1 text-xl font-semibold text-white">Current allocation by domain</h3>
							</div>
							<div className="h-[320px]">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie data={portfolioDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} innerRadius={70} paddingAngle={4}>
											{portfolioDistribution.map((entry) => (
												<Cell key={entry.name} fill={domainColors[entry.name]} />
											))}
										</Pie>
										<Tooltip
											contentStyle={{
												background: 'rgba(2, 6, 23, 0.95)',
												border: '1px solid rgba(255,255,255,0.1)',
												borderRadius: '16px',
												color: '#e2e8f0',
											}}
										/>
										<Legend />
									</PieChart>
								</ResponsiveContainer>
							</div>
						</div>
					</div>

					<div className="glass-panel rounded-[2rem] p-5 sm:p-6">
						<div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
							<div>
								<p className="text-xs uppercase tracking-[0.28em] text-rose-300">Company discovery</p>
								<h3 className="mt-1 text-xl font-semibold text-white">Startups matching your selected domains</h3>
							</div>
							<p className="text-sm text-slate-400">{matchingStartups.length} startup cards matched</p>
						</div>

						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{matchingStartups.map((startup) => (
								<article key={startup.name} className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20">
									<div className="flex items-start justify-between gap-3">
										<div>
											<p className="text-sm uppercase tracking-[0.28em] text-slate-400">{startup.domain}</p>
											<h4 className="mt-2 text-xl font-semibold text-white">{startup.name}</h4>
										</div>
										<span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
											{startup.matchScore}% match
										</span>
									</div>
									<p className="mt-4 text-sm leading-6 text-slate-300">{startup.summary}</p>

									<div className="mt-5 flex flex-wrap gap-2">
										<InfoPill label={startup.stage} tone="gold" />
										<InfoPill label={startup.location} tone="slate" />
									</div>

									<div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
										<div className="flex items-center justify-between gap-3">
											<span className="text-sm text-slate-400">Current traction</span>
											<span className="text-sm font-medium text-white">{startup.traction}</span>
										</div>
										<div className="h-2 rounded-full bg-slate-800">
											<div
												className="h-2 rounded-full bg-gradient-to-r from-gold via-teal-400 to-emerald-400"
												style={{ width: `${startup.matchScore}%` }}
											/>
										</div>
									</div>

									<button className="primary-button mt-5 w-full" type="button">
										View startup profile
									</button>
								</article>
							))}
							{!matchingStartups.length ? (
								<div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 p-6 text-slate-300 md:col-span-2 xl:col-span-3">
									No startups match the current filter selection yet.
								</div>
							) : null}
						</div>
					</div>
				</section>
			</div>
		</main>
	);
};

const StatCard = ({ label, value }) => (
	<div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
		<p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
		<p className="mt-2 text-3xl font-bold text-white">{value}</p>
	</div>
);

const InfoPill = ({ label, tone }) => (
	<span
		className={cx(
			'rounded-full px-3 py-1 text-xs font-semibold',
			tone === 'gold' && 'bg-gold/15 text-amber-200',
			tone === 'slate' && 'bg-white/10 text-slate-200'
		)}
	>
		{label}
	</span>
);

export default VcDashboard;
