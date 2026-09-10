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
import ConnectionActions from '../../components/ConnectionActions';
import NetworkHub from '../../components/NetworkHub';

const domainColors = {
	FinTech: '#2dd4bf',
	SaaS: '#f59e0b',
	HealthTech: '#fb7185',
	EdTech: '#a78bfa',
	Climate: '#4ade80',
	AI: '#38bdf8',
};

const stageOptions = ['Idea', 'MVP', 'Pre-Seed', 'Seed', 'Series A', 'Series B+'];

const cx = (...classes) => classes.filter(Boolean).join(' ');

const VcDashboard = () => {
	const { user, logout } = useAuth();
	const [dashboardData, setDashboardData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [selectedDomains, setSelectedDomains] = useState(user?.vcProfile?.domainInterests?.length ? user.vcProfile.domainInterests : []);

	// Startup Discovery State
	const [startups, setStartups] = useState([]);
	const [startupsLoading, setStartupsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedStage, setSelectedStage] = useState('');
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);

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

	// Fetch real paginated startups with search & filters
	const fetchStartups = async () => {
		try {
			setStartupsLoading(true);
			const params = new URLSearchParams();
			if (searchQuery.trim()) params.append('q', searchQuery.trim());
			if (selectedDomains.length === 1) params.append('domain', selectedDomains[0]);
			if (selectedStage) params.append('stage', selectedStage);
			params.append('page', page);
			params.append('limit', 6);

			const response = await api.get(`/users/startups?${params.toString()}`);
			setStartups(response.data.data?.startups || []);
			setTotalPages(response.data.data?.pagination?.totalPages || 1);
			setTotalCount(response.data.data?.pagination?.total || 0);
		} catch (err) {
			console.error('Failed to fetch startups discovery:', err);
		} finally {
			setStartupsLoading(false);
		}
	};

	useEffect(() => {
		if (user?.role === 'VC') {
			fetchStartups();
		}
	}, [user, page, searchQuery, selectedDomains, selectedStage]);

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
		setPage(1);
	};

	const clearFilters = () => {
		setSelectedDomains([]);
		setSelectedStage('');
		setSearchQuery('');
		setPage(1);
	};

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
								<StatCard label="Matched startups" value={totalCount || startups.length} />
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

					{/* Live Network & Connection Requests */}
					<NetworkHub title="VC Network & Connection Hub" />

					<div className="glass-panel rounded-[2rem] p-5 sm:p-6">
						<div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-4">
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<p className="text-xs uppercase tracking-[0.28em] text-rose-300">Live Discovery</p>
									<h3 className="mt-1 text-xl font-semibold text-white">Startup Discovery & Direct Outreach</h3>
								</div>
								<p className="text-xs text-slate-400">{totalCount} total startups registered</p>
							</div>

							<div className="grid gap-3 sm:grid-cols-3">
								<div className="sm:col-span-2">
									<input
										type="text"
										value={searchQuery}
										onChange={(e) => {
											setSearchQuery(e.target.value);
											setPage(1);
										}}
										placeholder="Search by company name, industry, founder, skills..."
										className="input-field text-sm"
									/>
								</div>
								<div>
									<select
										value={selectedStage}
										onChange={(e) => {
											setSelectedStage(e.target.value);
											setPage(1);
										}}
										className="input-field text-sm"
									>
										<option value="">All Stages</option>
										{stageOptions.map((st) => (
											<option key={st} value={st}>
												{st}
											</option>
										))}
									</select>
								</div>
							</div>
						</div>

						{startupsLoading ? (
							<div className="py-12 text-center text-slate-400 text-sm">Searching real startup ecosystem...</div>
						) : (
							<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
								{startups.map((startup) => (
									<article key={startup.id || startup._id} className="flex flex-col justify-between rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-5 transition duration-300 hover:-translate-y-1 hover:border-white/20">
										<div>
											<div className="flex items-start justify-between gap-3">
												<div>
													<p className="text-xs uppercase tracking-[0.28em] text-teal-300">{startup.domain}</p>
													<h4 className="mt-2 text-xl font-semibold text-white">{startup.name}</h4>
												</div>
												<span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
													{startup.matchScore || 85}% match
												</span>
											</div>
											<p className="mt-3 text-sm leading-6 text-slate-300 line-clamp-3">{startup.summary}</p>

											<div className="mt-4 flex flex-wrap gap-2">
												<InfoPill label={startup.stage} tone="gold" />
												<InfoPill label={startup.location} tone="slate" />
												{startup.teamSize ? <InfoPill label={`${startup.teamSize} team members`} tone="slate" /> : null}
											</div>

											{startup.skills && startup.skills.length ? (
												<div className="mt-3 flex flex-wrap gap-1.5">
													{startup.skills.slice(0, 3).map((sk) => (
														<span key={sk} className="rounded-md bg-white/5 px-2 py-0.5 text-[0.65rem] text-slate-300">
															{sk}
														</span>
													))}
												</div>
											) : null}
										</div>

										<div className="mt-5 border-t border-white/10 pt-4 flex items-center justify-between gap-2">
											<ConnectionActions
												targetUserId={startup.id || startup._id}
												initialStatus={startup.connectionStatus || 'none'}
												initialConnectionId={startup.connectionId}
											/>
										</div>
									</article>
								))}
								{!startups.length && (
									<div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 p-8 text-center text-slate-300 md:col-span-2 xl:col-span-3">
										No startups match the search criteria. Try clearing search filters.
									</div>
								)}
							</div>
						)}

						{/* Pagination Controls */}
						{totalPages > 1 ? (
							<div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
								<span>
									Page {page} of {totalPages}
								</span>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => setPage((p) => Math.max(1, p - 1))}
										disabled={page === 1}
										className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 disabled:opacity-40"
									>
										Previous
									</button>
									<button
										type="button"
										onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
										disabled={page === totalPages}
										className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 disabled:opacity-40"
									>
										Next
									</button>
								</div>
							</div>
						) : null}
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
