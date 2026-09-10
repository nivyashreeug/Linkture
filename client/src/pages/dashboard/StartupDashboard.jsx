import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ConnectionActions from '../../components/ConnectionActions';
import NetworkHub from '../../components/NetworkHub';

const sampleSuggestions = [
	'Summarize the pitch in one sentence.',
	'What is the strongest market advantage?',
	'Suggest a better funding narrative.',
	'Which VC domains should I target?',
];

const aiResponses = [
	'The deck positions the company as a focused solution to a real market pain point with a clear path to expansion.',
	'The best angle is to lead with traction, then reinforce why this category will scale quickly over the next 24 months.',
	'Your fundraising story will be stronger if you link customer pain, product differentiation, and distribution into one clear thesis.',
	'Target VCs that actively invest in your domain and stage, then personalize the outreach based on recent portfolio activity.',
];

const domainColors = {
	FinTech: '#2dd4bf',
	SaaS: '#f59e0b',
	HealthTech: '#fb7185',
	EdTech: '#a78bfa',
	Climate: '#4ade80',
	AI: '#38bdf8',
};

const StartupDashboard = () => {
	const { user, logout } = useAuth();
	const [deckFile, setDeckFile] = useState(null);
	const [messages, setMessages] = useState([
		{ role: 'assistant', text: 'Upload a pitch deck and I will analyze the opportunity, market, and investor fit.' },
	]);
	const [chatInput, setChatInput] = useState('');
	const [analysis, setAnalysis] = useState(null);
	const [notification, setNotification] = useState('');
	const [analyzing, setAnalyzing] = useState(false);

	// Phase 2 Live Discovery & Matching State
	const [matches, setMatches] = useState([]);
	const [matchesLoading, setMatchesLoading] = useState(false);
	const [investors, setInvestors] = useState([]);
	const [investorsLoading, setInvestorsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [investorPage, setInvestorPage] = useState(1);
	const [totalInvestorPages, setTotalInvestorPages] = useState(1);

	const fetchMatches = async () => {
		try {
			setMatchesLoading(true);
			const res = await api.get('/match');
			setMatches(res.data.matches || []);
		} catch (err) {
			console.error('Failed to fetch recommendations:', err);
		} finally {
			setMatchesLoading(false);
		}
	};

	const fetchInvestors = async () => {
		try {
			setInvestorsLoading(true);
			const params = new URLSearchParams();
			if (searchQuery.trim()) params.append('q', searchQuery.trim());
			params.append('page', investorPage);
			params.append('limit', 4);

			const res = await api.get(`/users/investors?${params.toString()}`);
			setInvestors(res.data.data?.investors || []);
			setTotalInvestorPages(res.data.data?.pagination?.totalPages || 1);
		} catch (err) {
			console.error('Failed to fetch investors:', err);
		} finally {
			setInvestorsLoading(false);
		}
	};

	useEffect(() => {
		if (user?.role === 'Startup') {
			fetchMatches();
			fetchInvestors();
		}
	}, [user, investorPage, searchQuery]);

	const targetDomain = useMemo(() => {
		const startupIndustry = user?.startupProfile?.industry?.trim();

		if (startupIndustry) {
			const normalizedIndustry = startupIndustry.toLowerCase();

			if (normalizedIndustry.includes('fin')) return 'FinTech';
			if (normalizedIndustry.includes('health')) return 'HealthTech';
			if (normalizedIndustry.includes('edu')) return 'EdTech';
			if (normalizedIndustry.includes('climate') || normalizedIndustry.includes('sustain')) return 'Climate';
			if (normalizedIndustry.includes('ai') || normalizedIndustry.includes('ml')) return 'AI';
			return 'SaaS';
		}

		return 'SaaS';
	}, [user]);

	const gaugeColor = domainColors[targetDomain] || '#f59e0b';

	const handleFileChange = (event) => {
		const file = event.target.files?.[0] || null;

		if (!file) {
			setDeckFile(null);
			return;
		}

		if (file.type !== 'application/pdf') {
			setNotification('Please upload a PDF pitch deck.');
			return;
		}

		setDeckFile(file);
		setNotification('Pitch deck uploaded. Ready for analysis.');
	};

	const analyzeDeck = () => {
		setAnalyzing(true);
		setNotification('Analyzing deck against market signals and investor fit...');

		window.setTimeout(() => {
			const scoreBase = deckFile ? 68 : 58;
			const domainBonus = targetDomain === 'AI' ? 10 : targetDomain === 'HealthTech' ? 8 : targetDomain === 'FinTech' ? 12 : 6;
			const score = Math.min(100, scoreBase + domainBonus);

			setAnalysis({
				score,
				summary:
					'The business shows a focused value proposition, a credible buyer pain point, and an attractive expansion path within the selected domain. The strongest next move is to sharpen traction storytelling and investor targeting.',
				domain: targetDomain,
			});
			setAnalyzing(false);
			setNotification('Analysis complete. Investor outreach is now available.');
		}, 900);
	};

	const handleSendMessage = () => {
		if (!chatInput.trim()) {
			return;
		}

		const prompt = chatInput.trim();
		const responseIndex = messages.length % aiResponses.length;

		setMessages((current) => [
			...current,
			{ role: 'user', text: prompt },
			{ role: 'assistant', text: aiResponses[responseIndex] },
		]);
		setChatInput('');
	};

	const handleQuickPrompt = (prompt) => {
		setChatInput(prompt);
	};

	if (!user) {
		return null;
	}

	return (
		<main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
			<div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
				<aside className="glass-panel rounded-[2rem] p-5 sm:p-6 lg:sticky lg:top-6 lg:h-fit">
					<div className="space-y-5">
						<div>
							<p className="text-xs uppercase tracking-[0.3em] text-slate-400">AI Pitch Analyst</p>
							<h1 className="mt-2 font-display text-3xl font-bold text-white">Startup dashboard</h1>
							<p className="mt-2 text-sm leading-6 text-slate-300">
								Ask for pitch feedback, investor targeting advice, and market framing while you build your deck.
							</p>
						</div>

						<div className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
							<div className="mb-3 flex items-center justify-between gap-3">
								<div>
									<p className="text-xs uppercase tracking-[0.28em] text-teal-300">Pitch deck upload</p>
									<p className="mt-1 text-sm text-slate-300">Upload PDF only</p>
								</div>
								<span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">PDF</span>
							</div>

							<label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/5 px-4 py-8 text-center transition hover:border-white/25 hover:bg-white/10">
								<input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
								<span className="text-sm font-semibold text-white">Click to upload your pitch deck</span>
								<span className="mt-2 text-xs leading-5 text-slate-400">Drop a PDF deck here or choose a file from your device.</span>
							</label>

							<div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
								<p className="font-semibold text-white">Uploaded file</p>
								<p className="mt-1 break-all">{deckFile ? deckFile.name : 'No PDF selected yet'}</p>
							</div>

							<button className="primary-button mt-4 w-full" type="button" onClick={analyzeDeck} disabled={analyzing}>
								{analyzing ? 'Analyzing deck...' : 'Analyze pitch deck'}
							</button>
						</div>

						<div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
							<div className="flex items-center justify-between gap-3">
								<p className="text-xs uppercase tracking-[0.28em] text-gold">Assistant prompts</p>
								<span className="text-xs text-slate-400">Quick actions</span>
							</div>
							<div className="mt-3 grid gap-2">
								{sampleSuggestions.map((prompt) => (
									<button
										key={prompt}
										className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10"
										type="button"
										onClick={() => handleQuickPrompt(prompt)}
									>
										{prompt}
									</button>
								))}
							</div>
						</div>

						<button className="ghost-button w-full" type="button" onClick={logout}>
							Logout
						</button>
					</div>
				</aside>

				<section className="space-y-6">
					<header className="glass-panel rounded-[2rem] p-6 sm:p-8">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-sm uppercase tracking-[0.3em] text-slate-400">{user.role}</p>
								<h2 className="mt-2 font-display text-4xl font-bold text-white sm:text-5xl">{user.startupProfile?.companyName || user.fullName}</h2>
								<p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
									Use the AI Pitch Analyst to refine the narrative, estimate market fit, and trigger VC outreach in your domain.
								</p>
							</div>
							<div className="flex flex-wrap gap-3">
								<StatChip label="Target domain" value={targetDomain} />
								<StatChip label="Stage" value={user.startupProfile?.startupStage || 'Seed'} />
							</div>
						</div>
						{notification ? <p className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{notification}</p> : null}
					</header>

					<div className="grid gap-6 xl:grid-cols-[1fr_360px]">
						<div className="space-y-6">
							<div className="glass-panel rounded-[2rem] p-5 sm:p-6">
								<div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
									<div>
										<p className="text-xs uppercase tracking-[0.28em] text-rose-300">Market Winning Chance</p>
										<h3 className="mt-1 text-xl font-semibold text-white">AI-generated pitch score</h3>
									</div>
									<div className="flex items-center gap-3">
										<div className="h-3 w-3 rounded-full" style={{ backgroundColor: gaugeColor }} />
										<span className="text-sm text-slate-300">Domain: {targetDomain}</span>
									</div>
								</div>

								<div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
									<GaugeChart value={analysis?.score || 0} color={gaugeColor} />
									<div className="space-y-4">
										<div className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-5">
											<p className="text-xs uppercase tracking-[0.28em] text-teal-300">Automated summary</p>
											<p className="mt-3 text-sm leading-7 text-slate-200">
												{analysis?.summary || 'Upload a deck and click analyze to generate an automated business summary.'}
											</p>
										</div>

										<div className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-5">
											<div className="flex items-center justify-between gap-3">
												<div>
													<p className="text-xs uppercase tracking-[0.28em] text-gold">Target Domain</p>
													<p className="mt-1 text-sm text-slate-300">Connect directly with active funds in {targetDomain}.</p>
												</div>
												<a href="#investor-discovery" className="primary-button text-xs py-2 px-4">
													Browse Investors ↓
												</a>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="glass-panel rounded-[2rem] p-5 sm:p-6">
								<div className="mb-4 flex items-center justify-between gap-3">
									<div>
										<p className="text-xs uppercase tracking-[0.28em] text-gold">Pitch analyst output</p>
										<h3 className="mt-1 text-xl font-semibold text-white">Analysis state</h3>
									</div>
									<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
										{analysis ? `${analysis.score}% market winning chance` : 'Awaiting analysis'}
									</span>
								</div>

								{analysis ? (
									<div className="grid gap-4 md:grid-cols-3">
										<MetricCard label="Chance" value={`${analysis.score}%`} />
										<MetricCard label="Domain" value={analysis.domain} />
										<MetricCard label="Investor fit" value={analysis.score >= 80 ? 'Strong' : analysis.score >= 65 ? 'Moderate' : 'Early'} />
									</div>
								) : (
									<div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-300">
										Upload a PDF pitch deck and run the pitch analyzer.
									</div>
								)}
							</div>
						</div>

						<div className="glass-panel rounded-[2rem] p-5 sm:p-6">
							<div className="mb-4 flex items-center justify-between gap-3">
								<div>
									<p className="text-xs uppercase tracking-[0.28em] text-teal-300">AI Pitch Analyst</p>
									<h3 className="mt-1 text-xl font-semibold text-white">Chatbox</h3>
								</div>
								<span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">Sidebar</span>
							</div>

							<div className="flex h-[520px] flex-col rounded-[1.5rem] border border-white/10 bg-slate-950/55">
								<div className="flex-1 space-y-4 overflow-y-auto p-4">
									{messages.map((message, index) => (
										<ChatBubble key={`${message.role}-${index}`} role={message.role} text={message.text} />
									))}
								</div>

								<div className="border-t border-white/10 p-4">
									<textarea
										className="input-field min-h-[96px] resize-none"
										value={chatInput}
										onChange={(event) => setChatInput(event.target.value)}
										placeholder="Ask the AI Pitch Analyst a question..."
									/>
									<button className="primary-button mt-3 w-full" type="button" onClick={handleSendMessage}>
										Send to Analyst
									</button>
								</div>
							</div>
						</div>
					</div>

					{/* Live Network & Requests */}
					<NetworkHub title="Startup Network & Outreach Requests" />

					{/* Recommended Investor Matches via /api/match */}
					<div className="glass-panel rounded-[2rem] p-5 sm:p-6">
						<div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
							<div>
								<p className="text-xs uppercase tracking-[0.28em] text-teal-300">AI Matching Engine</p>
								<h3 className="mt-1 text-xl font-semibold text-white">Recommended Investor Matches</h3>
							</div>
							<span className="rounded-full bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-200">
								Live Match Score
							</span>
						</div>

						{matchesLoading ? (
							<p className="py-8 text-center text-xs text-slate-400">Loading complementary investor matches...</p>
						) : matches.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-xs text-slate-400">
								No new recommendations right now. Expand your skills and interests to discover more investors.
							</div>
						) : (
							<div className="grid gap-4 md:grid-cols-2">
								{matches.map((match) => (
									<div
										key={match.id || match._id}
										className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-5"
									>
										<div>
											<div className="flex items-start justify-between gap-3">
												<div>
													<p className="text-xs uppercase tracking-[0.28em] text-gold">{match.domain || 'VC Fund'}</p>
													<h4 className="mt-1 text-lg font-semibold text-white">{match.name}</h4>
												</div>
												<span className="rounded-full bg-teal-400/15 px-2.5 py-1 text-xs font-bold text-teal-200">
													{match.matchScore} pts
												</span>
											</div>
											<p className="mt-2 text-xs text-slate-300 line-clamp-2">{match.bio || 'Investor looking for high-growth startups.'}</p>
											{match.sharedSkills && match.sharedSkills.length ? (
												<div className="mt-3 flex flex-wrap gap-1">
													{match.sharedSkills.map((sk) => (
														<span key={sk} className="rounded bg-teal-400/10 px-2 py-0.5 text-[0.65rem] text-teal-300">
															+ {sk}
														</span>
													))}
												</div>
											) : null}
										</div>
										<div className="mt-4 border-t border-white/10 pt-3">
											<ConnectionActions
												targetUserId={match.id || match._id}
												initialStatus={match.connectionStatus || 'none'}
												initialConnectionId={match.connectionId}
											/>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					{/* Live Investor Discovery */}
					<div id="investor-discovery" className="glass-panel rounded-[2rem] p-5 sm:p-6">
						<div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-4">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
								<div>
									<p className="text-xs uppercase tracking-[0.28em] text-rose-300">Discovery Engine</p>
									<h3 className="mt-1 text-xl font-semibold text-white">Active Investors & Venture Funds</h3>
								</div>
								<p className="text-xs text-slate-400">Page {investorPage} of {totalInvestorPages}</p>
							</div>

							<div>
								<input
									type="text"
									value={searchQuery}
									onChange={(e) => {
										setSearchQuery(e.target.value);
										setInvestorPage(1);
									}}
									placeholder="Search investors by fund name, partner, domain focus, or location..."
									className="input-field text-sm"
								/>
							</div>
						</div>

						{investorsLoading ? (
							<p className="py-8 text-center text-xs text-slate-400">Loading active investor directory...</p>
						) : investors.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-xs text-slate-400">
								No investors found. Try adjusting your search keywords.
							</div>
						) : (
							<div className="grid gap-4 md:grid-cols-2">
								{investors.map((inv) => (
									<div
										key={inv.id || inv._id}
										className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-5"
									>
										<div>
											<div className="flex items-start justify-between gap-3">
												<div>
													<p className="text-xs uppercase tracking-[0.28em] text-slate-400">{inv.firmName}</p>
													<h4 className="mt-1 text-lg font-semibold text-white">{inv.fullName}</h4>
												</div>
												<span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-200">
													{inv.location || 'Remote'}
												</span>
											</div>
											<p className="mt-2 text-xs text-slate-300 line-clamp-2">{inv.bio}</p>

											{inv.domains && inv.domains.length ? (
												<div className="mt-3 flex flex-wrap gap-1.5">
													{inv.domains.map((dom) => (
														<span key={dom} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[0.65rem] text-slate-200">
															{dom}
														</span>
													))}
												</div>
											) : null}
										</div>

										<div className="mt-4 border-t border-white/10 pt-3">
											<ConnectionActions
												targetUserId={inv.id || inv._id}
												initialStatus={inv.connectionStatus || 'none'}
												initialConnectionId={inv.connectionId}
											/>
										</div>
									</div>
								))}
							</div>
						)}

						{totalInvestorPages > 1 ? (
							<div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
								<span>Page {investorPage} of {totalInvestorPages}</span>
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => setInvestorPage((p) => Math.max(1, p - 1))}
										disabled={investorPage === 1}
										className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 disabled:opacity-40"
									>
										Previous
									</button>
									<button
										type="button"
										onClick={() => setInvestorPage((p) => Math.min(totalInvestorPages, p + 1))}
										disabled={investorPage === totalInvestorPages}
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

const GaugeChart = ({ value, color }) => {
	const safeValue = Math.max(0, Math.min(100, value));
	const radius = 70;
	const strokeWidth = 18;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (safeValue / 100) * circumference;

	return (
		<div className="flex justify-center">
			<div className="relative h-[220px] w-[220px]">
				<svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
					<circle cx="100" cy="100" r={radius} stroke="rgba(148, 163, 184, 0.15)" strokeWidth={strokeWidth} fill="none" strokeLinecap="round" />
					<circle
						cx="100"
						cy="100"
						r={radius}
						stroke={color}
						strokeWidth={strokeWidth}
						fill="none"
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={offset}
						style={{ transition: 'stroke-dashoffset 0.8s ease' }}
					/>
				</svg>
				<div className="absolute inset-0 flex flex-col items-center justify-center text-center">
					<p className="text-xs uppercase tracking-[0.3em] text-slate-400">Market chance</p>
					<p className="mt-2 font-display text-5xl font-bold text-white">{safeValue}%</p>
					<p className="mt-2 text-xs text-slate-400">Higher is better</p>
				</div>
			</div>
		</div>
	);
};

const StatChip = ({ label, value }) => (
	<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left">
		<p className="text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">{label}</p>
		<p className="mt-1 text-sm font-semibold text-white">{value}</p>
	</div>
);

const MetricCard = ({ label, value }) => (
	<div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-center">
		<p className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
		<p className="mt-3 text-lg font-semibold text-white">{value}</p>
	</div>
);

const ChatBubble = ({ role, text }) => (
	<div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
		<div
			className={`max-w-[85%] rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${
				role === 'user' ? 'bg-gold text-slate-950' : 'border border-white/10 bg-white/5 text-slate-100'
			}`}
		>
			<p className="mb-1 text-[0.65rem] uppercase tracking-[0.3em] opacity-70">{role === 'user' ? 'You' : 'AI Pitch Analyst'}</p>
			<p>{text}</p>
		</div>
	</div>
);

export default StartupDashboard;
