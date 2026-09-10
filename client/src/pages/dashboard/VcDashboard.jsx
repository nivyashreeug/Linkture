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

const allDomainOptions = ['AI', 'SaaS', 'FinTech', 'HealthTech', 'Climate', 'EdTech'];
const stageOptions = ['Idea', 'MVP', 'Pre-Seed', 'Seed', 'Series A', 'Series B+'];

const cx = (...classes) => classes.filter(Boolean).join(' ');

const VcDashboard = () => {
	const { user, logout, setUser } = useAuth();
	const [dashboardData, setDashboardData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [notification, setNotification] = useState('');
	const [selectedDomains, setSelectedDomains] = useState(
		user?.vcProfile?.domainInterests?.length ? user.vcProfile.domainInterests : ['AI', 'SaaS']
	);

	// Edit Profile Modal State
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [savingProfile, setSavingProfile] = useState(false);
	const [editError, setEditError] = useState('');
	const [formData, setFormData] = useState({
		fullName: '',
		firmName: '',
		bio: '',
		location: '',
		domainInterests: [],
		investmentStage: [],
		ticketSizeMin: '',
		ticketSizeMax: '',
		preferredRegions: '',
		portfolioCount: '',
		skills: '',
		interests: '',
	});

	// Startup Discovery State
	const [startups, setStartups] = useState([]);
	const [startupsLoading, setStartupsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedStage, setSelectedStage] = useState('');
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);

	// Sync form data when user changes or modal opens
	useEffect(() => {
		if (user) {
			const vp = user.vcProfile || {};
			setFormData({
				fullName: user.fullName || '',
				firmName: vp.firmName || user.roleDetails?.vc?.firmName || '',
				bio: user.bio || '',
				location: user.location || '',
				domainInterests: vp.domainInterests?.length ? vp.domainInterests : ['AI', 'SaaS'],
				investmentStage: vp.investmentStage || ['Seed', 'Series A'],
				ticketSizeMin: vp.ticketSizeMin || '',
				ticketSizeMax: vp.ticketSizeMax || '',
				preferredRegions: vp.preferredRegions?.join(', ') || 'Global',
				portfolioCount: vp.portfolioCount || '',
				skills: Array.isArray(user.skills) ? user.skills.join(', ') : '',
				interests: Array.isArray(user.interests) ? user.interests.join(', ') : '',
			});
			if (vp.domainInterests?.length) {
				setSelectedDomains(vp.domainInterests);
			}
		}
	}, [user, isEditOpen]);

	useEffect(() => {
		const fetchDashboard = async () => {
			try {
				setLoading(true);
				const response = await api.get('/users/vc/dashboard');
				setDashboardData(response.data.data);
				if (response.data.data.selectedDomains?.length) {
					setSelectedDomains(response.data.data.selectedDomains);
				}
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

	const investmentDomains = dashboardData?.investmentDomains || allDomainOptions;
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

	const handleSaveProfile = async (e) => {
		e.preventDefault();
		setSavingProfile(true);
		setEditError('');

		try {
			const payload = {
				fullName: formData.fullName.trim(),
				bio: formData.bio.trim(),
				location: formData.location.trim(),
				skills: formData.skills ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
				interests: formData.interests ? formData.interests.split(',').map((i) => i.trim()).filter(Boolean) : [],
				vcProfile: {
					firmName: formData.firmName.trim(),
					domainInterests: formData.domainInterests.length ? formData.domainInterests : ['AI', 'SaaS'],
					investmentStage: formData.investmentStage,
					ticketSizeMin: formData.ticketSizeMin ? Number(formData.ticketSizeMin) : undefined,
					ticketSizeMax: formData.ticketSizeMax ? Number(formData.ticketSizeMax) : undefined,
					preferredRegions: formData.preferredRegions ? formData.preferredRegions.split(',').map((r) => r.trim()).filter(Boolean) : [],
					portfolioCount: formData.portfolioCount ? Number(formData.portfolioCount) : undefined,
				},
			};

			const response = await api.put('/profile', payload);
			setUser(response.data.user);
			setSelectedDomains(response.data.user.vcProfile?.domainInterests || ['AI', 'SaaS']);
			setIsEditOpen(false);
			setNotification('Investor profile and investment criteria saved to database.');
			setTimeout(() => setNotification(''), 4000);
		} catch (err) {
			console.error('Failed to update VC profile:', err);
			setEditError(err.response?.data?.message || 'Failed to update investor preferences.');
		} finally {
			setSavingProfile(false);
		}
	};

	const toggleDomain = (domain) => {
		setSelectedDomains((current) =>
			current.includes(domain) ? current.filter((item) => item !== domain) : [...current, domain]
		);
		setPage(1);
	};

	const toggleFormDomain = (domain) => {
		setFormData((prev) => {
			const exists = prev.domainInterests.includes(domain);
			const updated = exists ? prev.domainInterests.filter((d) => d !== domain) : [...prev.domainInterests, domain];
			return { ...prev, domainInterests: updated };
		});
	};

	const toggleFormStage = (stage) => {
		setFormData((prev) => {
			const exists = prev.investmentStage.includes(stage);
			const updated = exists ? prev.investmentStage.filter((s) => s !== stage) : [...prev.investmentStage, stage];
			return { ...prev, investmentStage: updated };
		});
	};

	if (!user) {
		return null;
	}

	const currentFirm = user.vcProfile?.firmName || user.roleDetails?.vc?.firmName || 'Independent Venture Fund';
	const minCheck = user.vcProfile?.ticketSizeMin ? `$${(user.vcProfile.ticketSizeMin / 1000).toFixed(0)}k` : '$100k';
	const maxCheck = user.vcProfile?.ticketSizeMax ? `$${(user.vcProfile.ticketSizeMax / 1000000).toFixed(1)}M` : '$2.0M';

	return (
		<main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl space-y-6">
				{/* Investor Header */}
				<header className="glass-panel rounded-[2rem] p-6 sm:p-8">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<div className="flex items-center gap-2">
								<p className="text-xs uppercase tracking-[0.3em] text-teal-300">VC Partner Workspace</p>
								<span className="rounded-full bg-teal-400/15 px-2.5 py-0.5 text-[0.65rem] font-semibold text-teal-200">
									Active Investor
								</span>
							</div>
							<h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
								{currentFirm}
							</h1>
							<p className="mt-1 text-sm font-semibold text-gold">Partner: {user.fullName}</p>
							<p className="mt-2 max-w-2xl text-xs leading-6 text-slate-300">
								{user.bio || 'Manage fund investment mandate, review real dealflow pipelines, and back high-potential founders.'}
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<button
								type="button"
								onClick={() => setIsEditOpen(true)}
								className="primary-button text-xs py-2 px-4"
							>
								✎ Edit Investment Mandate
							</button>
							<button className="ghost-button text-xs py-2 px-4" type="button" onClick={logout}>
								Logout
							</button>
						</div>
					</div>

					{/* Criteria Quick Bar */}
					<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-white/10 pt-5">
						<div className="rounded-xl border border-white/10 bg-white/5 p-3">
							<span className="text-[0.65rem] uppercase tracking-wider text-slate-400">Target Check Size</span>
							<p className="mt-1 text-xs font-bold text-white">{minCheck} - {maxCheck}</p>
						</div>
						<div className="rounded-xl border border-white/10 bg-white/5 p-3">
							<span className="text-[0.65rem] uppercase tracking-wider text-slate-400">Target Stages</span>
							<p className="mt-1 text-xs font-bold text-white truncate">
								{user.vcProfile?.investmentStage?.length ? user.vcProfile.investmentStage.join(', ') : 'Seed, Series A'}
							</p>
						</div>
						<div className="rounded-xl border border-white/10 bg-white/5 p-3">
							<span className="text-[0.65rem] uppercase tracking-wider text-slate-400">Geography</span>
							<p className="mt-1 text-xs font-bold text-white truncate">
								{user.vcProfile?.preferredRegions?.length ? user.vcProfile.preferredRegions.join(', ') : user.location || 'Global'}
							</p>
						</div>
						<div className="rounded-xl border border-white/10 bg-white/5 p-3">
							<span className="text-[0.65rem] uppercase tracking-wider text-slate-400">Active Deals Found</span>
							<p className="mt-1 text-xs font-bold text-teal-300">{totalCount} Startups</p>
						</div>
					</div>

					{notification && (
						<div className="mt-4 rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-xs text-teal-200">
							{notification}
						</div>
					)}
					{error && (
						<div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
							{error}
						</div>
					)}
				</header>

				{/* Domain Filters */}
				<section className="glass-panel rounded-[2rem] p-5 sm:p-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-xs uppercase tracking-[0.28em] text-teal-300">Target Domain Sectors</p>
							<h2 className="mt-1 text-lg font-bold text-white">Focus Filter</h2>
						</div>
						<div className="flex flex-wrap gap-2">
							{allDomainOptions.map((domain) => {
								const active = selectedDomains.includes(domain);
								return (
									<button
										key={domain}
										type="button"
										onClick={() => toggleDomain(domain)}
										className={cx(
											'rounded-xl border px-3 py-1.5 text-xs font-medium transition',
											active
												? 'border-teal-400 bg-teal-400/20 text-white'
												: 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
										)}
									>
										{domain}
									</button>
								);
							})}
						</div>
					</div>
				</section>

				{/* Market Trends & Portfolio Insights */}
				<div className="grid gap-6 lg:grid-cols-2">
					<section className="glass-panel rounded-[2rem] p-5 sm:p-6">
						<div className="mb-4 flex items-center justify-between">
							<div>
								<p className="text-xs uppercase tracking-[0.28em] text-gold">Market Signals</p>
								<h3 className="mt-1 text-lg font-bold text-white">Deal Velocity & Trends</h3>
							</div>
							<span className="text-xs text-slate-400">Monthly index</span>
						</div>
						<div className="h-64 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={marketTrends}>
									<CartesianGrid strokeDasharray="3 3" stroke="#334155" />
									<XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }} />
									<YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
									<Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }} />
									<Legend wrapperStyle={{ fontSize: '11px' }} />
									{visibleTrendKeys.map((domain) => (
										<Line key={domain} type="monotone" dataKey={domain} stroke={domainColors[domain] || '#38bdf8'} strokeWidth={2} dot={{ r: 3 }} />
									))}
								</LineChart>
							</ResponsiveContainer>
						</div>
					</section>

					<section className="glass-panel rounded-[2rem] p-5 sm:p-6">
						<div className="mb-4 flex items-center justify-between">
							<div>
								<p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Sector Allocation</p>
								<h3 className="mt-1 text-lg font-bold text-white">Portfolio Weighting</h3>
							</div>
							<span className="text-xs text-slate-400">By sector %</span>
						</div>
						<div className="h-64 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie data={portfolioDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={{ fontSize: 10 }}>
										{portfolioDistribution.map((entry) => (
											<Cell key={`cell-${entry.name}`} fill={domainColors[entry.name] || '#f59e0b'} />
										))}
									</Pie>
									<Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }} />
									<Legend wrapperStyle={{ fontSize: '11px' }} />
								</PieChart>
							</ResponsiveContainer>
						</div>
					</section>
				</div>

				{/* Live Network & Requests */}
				<NetworkHub title="VC Inbound Pitches & Connection Requests" />

				{/* Live Startup Dealflow Pipeline */}
				<section className="glass-panel rounded-[2rem] p-6 sm:p-8">
					<div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
							<div>
								<p className="text-xs uppercase tracking-[0.28em] text-teal-300">Dealflow Pipeline</p>
								<h2 className="mt-1 text-2xl font-bold text-white">Live Startup Discovery</h2>
							</div>
							<p className="text-xs text-slate-400">
								Showing {startups.length} of {totalCount} matching startups (Page {page} of {totalPages})
							</p>
						</div>

						<div className="flex flex-col sm:flex-row gap-3">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setPage(1);
								}}
								placeholder="Search startups by company name, technology, or problem thesis..."
								className="input-field flex-1 text-sm"
							/>
							<select
								value={selectedStage}
								onChange={(e) => {
									setSelectedStage(e.target.value);
									setPage(1);
								}}
								className="input-field sm:w-48 text-sm bg-slate-900"
							>
								<option value="">All Funding Stages</option>
								{stageOptions.map((st) => (
									<option key={st} value={st}>{st}</option>
								))}
							</select>
						</div>
					</div>

					{startupsLoading ? (
						<p className="py-12 text-center text-xs text-slate-400">Querying database for live startups...</p>
					) : startups.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-xs text-slate-400">
							No startups match your search criteria. Try removing filters or searching a different domain.
						</div>
					) : (
						<div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
							{startups.map((s) => (
								<div
									key={s.id || s._id}
									className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-5 transition hover:border-white/20"
								>
									<div>
										<div className="flex items-start justify-between gap-2">
											<div>
												<span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[0.65rem] font-medium text-gold">
													{s.domain || 'Tech'}
												</span>
												<h4 className="mt-1.5 text-base font-bold text-white">{s.name}</h4>
											</div>
											<span className="rounded-full bg-teal-400/15 px-2 py-0.5 text-[0.65rem] font-bold text-teal-200">
												{s.stage || 'Seed'}
											</span>
										</div>

										{s.tagline ? (
											<p className="mt-1.5 text-xs font-medium text-teal-300 line-clamp-1">{s.tagline}</p>
										) : null}

										<p className="mt-2 text-xs leading-5 text-slate-300 line-clamp-2">{s.summary || s.bio}</p>

										{s.problem ? (
											<div className="mt-2 rounded-lg bg-white/5 p-2 text-[0.7rem] text-slate-300 line-clamp-2">
												<strong className="text-rose-300">Problem:</strong> {s.problem}
											</div>
										) : null}

										<div className="mt-3 flex flex-wrap gap-2 text-[0.7rem] text-slate-400">
											<span>📍 {s.location || 'Remote'}</span>
											{s.teamSize ? <span>👥 {s.teamSize} team</span> : null}
											{s.fundingTarget ? (
												<span className="text-teal-300 font-semibold">
													🎯 ${(s.fundingTarget / 1000).toFixed(0)}k Target
												</span>
											) : null}
										</div>

										{s.pitchDeckUrl ? (
											<div className="mt-3">
												<a
													href={s.pitchDeckUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1 text-[0.7rem] font-semibold text-teal-300 hover:underline"
												>
													📄 View Pitch Deck
												</a>
											</div>
										) : null}
									</div>

									<div className="mt-4 border-t border-white/10 pt-3">
										<ConnectionActions
											targetUserId={s.id || s._id}
											initialStatus={s.connectionStatus || 'none'}
											initialConnectionId={s.connectionId}
										/>
									</div>
								</div>
							))}
						</div>
					)}

					{totalPages > 1 ? (
						<div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
							<span>Page {page} of {totalPages}</span>
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
				</section>
			</div>

			{/* Edit VC Profile & Mandate Modal */}
			{isEditOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
					<div className="glass-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] p-6 sm:p-8">
						<div className="flex items-center justify-between border-b border-white/10 pb-4">
							<div>
								<p className="text-xs uppercase tracking-[0.28em] text-teal-300">Investor Workspace</p>
								<h3 className="mt-1 text-2xl font-bold text-white">Edit Investment Mandate</h3>
							</div>
							<button
								type="button"
								onClick={() => setIsEditOpen(false)}
								className="rounded-full bg-white/10 p-2 text-slate-300 hover:bg-white/20"
							>
								✕
							</button>
						</div>

						{editError && (
							<div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
								{editError}
							</div>
						)}

						<form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label className="text-xs font-semibold text-slate-300">Investor / Partner Name</label>
									<input
										type="text"
										required
										className="input-field mt-1 text-sm"
										value={formData.fullName}
										onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
									/>
								</div>

								<div>
									<label className="text-xs font-semibold text-slate-300">Fund / Firm Name</label>
									<input
										type="text"
										required
										className="input-field mt-1 text-sm"
										value={formData.firmName}
										onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
									/>
								</div>
							</div>

							<div>
								<label className="text-xs font-semibold text-slate-300">Investment Thesis / Bio</label>
								<textarea
									rows={3}
									placeholder="Describe your investment focus, stage preferences, and founder expectations..."
									className="input-field mt-1 text-sm resize-none"
									value={formData.bio}
									onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
								/>
							</div>

							<div>
								<label className="text-xs font-semibold text-slate-300">Target Industry Sectors</label>
								<div className="mt-2 flex flex-wrap gap-2">
									{allDomainOptions.map((domain) => {
										const active = formData.domainInterests.includes(domain);
										return (
											<button
												key={domain}
												type="button"
												onClick={() => toggleFormDomain(domain)}
												className={cx(
													'rounded-xl border px-3 py-1 text-xs font-medium transition',
													active
														? 'border-teal-400 bg-teal-400/20 text-white'
														: 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
												)}
											>
												{active ? '✓ ' : '+ '} {domain}
											</button>
										);
									})}
								</div>
							</div>

							<div>
								<label className="text-xs font-semibold text-slate-300">Target Funding Stages</label>
								<div className="mt-2 flex flex-wrap gap-2">
									{stageOptions.map((stage) => {
										const active = formData.investmentStage.includes(stage);
										return (
											<button
												key={stage}
												type="button"
												onClick={() => toggleFormStage(stage)}
												className={cx(
													'rounded-xl border px-3 py-1 text-xs font-medium transition',
													active
														? 'border-gold bg-gold/20 text-gold'
														: 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
												)}
											>
												{active ? '✓ ' : '+ '} {stage}
											</button>
										);
									})}
								</div>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label className="text-xs font-semibold text-slate-300">Min Check Size ($)</label>
									<input
										type="number"
										min="0"
										placeholder="e.g. 100000"
										className="input-field mt-1 text-sm"
										value={formData.ticketSizeMin}
										onChange={(e) => setFormData({ ...formData, ticketSizeMin: e.target.value })}
									/>
								</div>

								<div>
									<label className="text-xs font-semibold text-slate-300">Max Check Size ($)</label>
									<input
										type="number"
										min="0"
										placeholder="e.g. 2000000"
										className="input-field mt-1 text-sm"
										value={formData.ticketSizeMax}
										onChange={(e) => setFormData({ ...formData, ticketSizeMax: e.target.value })}
									/>
								</div>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label className="text-xs font-semibold text-slate-300">Headquarters / Location</label>
									<input
										type="text"
										placeholder="e.g. San Francisco, CA"
										className="input-field mt-1 text-sm"
										value={formData.location}
										onChange={(e) => setFormData({ ...formData, location: e.target.value })}
									/>
								</div>

								<div>
									<label className="text-xs font-semibold text-slate-300">Preferred Regions</label>
									<input
										type="text"
										placeholder="e.g. North America, Global"
										className="input-field mt-1 text-sm"
										value={formData.preferredRegions}
										onChange={(e) => setFormData({ ...formData, preferredRegions: e.target.value })}
									/>
								</div>
							</div>

							<div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
								<button
									type="button"
									onClick={() => setIsEditOpen(false)}
									className="ghost-button px-5 py-2 text-sm"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={savingProfile}
									className="primary-button px-6 py-2 text-sm"
								>
									{savingProfile ? 'Saving Mandate...' : 'Save Mandate'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</main>
	);
};

export default VcDashboard;
