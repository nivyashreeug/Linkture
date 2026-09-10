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

const stageOptions = ['Idea', 'MVP', 'Pre-Seed', 'Seed', 'Series A', 'Series B+'];
const industryOptions = ['AI', 'SaaS', 'FinTech', 'HealthTech', 'Climate', 'EdTech', 'Consumer', 'Enterprise', 'Hardware'];

const StartupDashboard = () => {
	const { user, logout, setUser } = useAuth();
	const [deckFile, setDeckFile] = useState(null);
	const [uploadingDeck, setUploadingDeck] = useState(false);
	const [messages, setMessages] = useState([
		{ role: 'assistant', text: 'Upload a pitch deck or complete your profile, and I will analyze the opportunity, market, and investor fit.' },
	]);
	const [chatInput, setChatInput] = useState('');
	const [analysis, setAnalysis] = useState(null);
	const [notification, setNotification] = useState('');
	const [notificationType, setNotificationType] = useState('info'); // 'info' | 'success' | 'error'
	const [analyzing, setAnalyzing] = useState(false);

	// Edit Profile Modal State
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [savingProfile, setSavingProfile] = useState(false);
	const [editError, setEditError] = useState('');
	const [formData, setFormData] = useState({
		fullName: '',
		companyName: '',
		tagline: '',
		bio: '',
		industry: '',
		startupStage: 'Seed',
		fundingTarget: '',
		location: '',
		websiteUrl: '',
		teamSize: '',
		foundingYear: '',
		problem: '',
		solution: '',
		businessModel: '',
		skills: '',
		interests: '',
	});

	// Phase 2 Live Discovery & Matching State
	const [matches, setMatches] = useState([]);
	const [matchesLoading, setMatchesLoading] = useState(false);
	const [investors, setInvestors] = useState([]);
	const [investorsLoading, setInvestorsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [investorPage, setInvestorPage] = useState(1);
	const [totalInvestorPages, setTotalInvestorPages] = useState(1);

	// Initialize form data when user loads or edit modal opens
	useEffect(() => {
		if (user) {
			setFormData({
				fullName: user.fullName || '',
				companyName: user.startupProfile?.companyName || '',
				tagline: user.startupProfile?.tagline || '',
				bio: user.bio || '',
				industry: user.startupProfile?.industry || 'AI',
				startupStage: user.startupProfile?.startupStage || 'Seed',
				fundingTarget: user.startupProfile?.fundingTarget || '',
				location: user.location || '',
				websiteUrl: user.startupProfile?.websiteUrl || '',
				teamSize: user.startupProfile?.teamSize || '',
				foundingYear: user.startupProfile?.foundingYear || '',
				problem: user.startupProfile?.problem || '',
				solution: user.startupProfile?.solution || '',
				businessModel: user.startupProfile?.businessModel || '',
				skills: Array.isArray(user.skills) ? user.skills.join(', ') : '',
				interests: Array.isArray(user.interests) ? user.interests.join(', ') : '',
			});
		}
	}, [user, isEditOpen]);

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

	const profileCompleteness = useMemo(() => {
		if (!user) return 0;
		const sp = user.startupProfile || {};
		const fields = [
			sp.companyName,
			sp.tagline,
			user.bio,
			sp.industry,
			sp.startupStage,
			sp.problem,
			sp.solution,
			sp.businessModel,
			sp.pitchDeck?.fileName || sp.pitchDeckUrl,
			user.location,
		];
		const filled = fields.filter(Boolean).length;
		return Math.round((filled / fields.length) * 100);
	}, [user]);

	const gaugeColor = domainColors[targetDomain] || '#f59e0b';

	// Pitch deck file select and direct upload
	const handlePitchDeckUpload = async (event) => {
		const file = event.target.files?.[0] || null;
		if (!file) return;

		if (file.type !== 'application/pdf') {
			setNotification('Invalid format. Please upload a PDF pitch deck.');
			setNotificationType('error');
			return;
		}

		if (file.size > 10 * 1024 * 1024) {
			setNotification('File too large. Maximum PDF size is 10MB.');
			setNotificationType('error');
			return;
		}

		try {
			setUploadingDeck(true);
			setNotification('Uploading pitch deck...');
			setNotificationType('info');

			const body = new FormData();
			body.append('pitchDeck', file);

			const response = await api.post('/startups/pitch', body, {
				headers: { 'Content-Type': 'multipart/form-data' },
			});

			if (response.data.user) {
				setUser(response.data.user);
			} else if (response.data.pitchDeck) {
				setUser((prev) => ({
					...prev,
					startupProfile: {
						...prev.startupProfile,
						pitchDeck: response.data.pitchDeck,
						pitchDeckUrl: response.data.pitchDeckUrl,
					},
				}));
			}

			setDeckFile(file);
			setNotification('Pitch deck uploaded and saved successfully.');
			setNotificationType('success');
		} catch (err) {
			console.error('Pitch deck upload failed:', err);
			setNotification(err.response?.data?.message || 'Failed to upload pitch deck. Please try again.');
			setNotificationType('error');
		} finally {
			setUploadingDeck(false);
		}
	};

	const handleDeletePitchDeck = async () => {
		if (!window.confirm('Are you sure you want to remove your pitch deck?')) return;
		try {
			setUploadingDeck(true);
			const res = await api.delete('/startups/pitch');
			if (res.data.user) {
				setUser(res.data.user);
			} else {
				setUser((prev) => ({
					...prev,
					startupProfile: {
						...prev.startupProfile,
						pitchDeck: null,
						pitchDeckUrl: '',
					},
				}));
			}
			setDeckFile(null);
			setNotification('Pitch deck removed.');
			setNotificationType('info');
		} catch (err) {
			console.error('Failed to delete pitch deck:', err);
			setNotification(err.response?.data?.message || 'Failed to remove pitch deck.');
			setNotificationType('error');
		} finally {
			setUploadingDeck(false);
		}
	};

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
				startupProfile: {
					companyName: formData.companyName.trim(),
					tagline: formData.tagline.trim(),
					industry: formData.industry.trim(),
					startupStage: formData.startupStage,
					fundingTarget: formData.fundingTarget ? Number(formData.fundingTarget) : undefined,
					websiteUrl: formData.websiteUrl.trim() || undefined,
					teamSize: formData.teamSize ? Number(formData.teamSize) : undefined,
					foundingYear: formData.foundingYear ? Number(formData.foundingYear) : undefined,
					problem: formData.problem.trim(),
					solution: formData.solution.trim(),
					businessModel: formData.businessModel.trim(),
				},
			};

			const response = await api.put('/profile', payload);
			setUser(response.data.user);
			setIsEditOpen(false);
			setNotification('Startup workspace updated and saved to database.');
			setNotificationType('success');
		} catch (err) {
			console.error('Failed to update startup profile:', err);
			setEditError(err.response?.data?.message || 'Failed to update profile. Please verify your inputs.');
		} finally {
			setSavingProfile(false);
		}
	};

	const analyzeDeck = () => {
		setAnalyzing(true);
		setNotification('Analyzing startup data against investor criteria and market fit...');
		setNotificationType('info');

		window.setTimeout(() => {
			const hasDeck = user?.startupProfile?.pitchDeck || deckFile || user?.startupProfile?.pitchDeckUrl;
			const scoreBase = hasDeck ? 72 : 58;
			const completenessBonus = Math.round(profileCompleteness * 0.15);
			const domainBonus = targetDomain === 'AI' ? 10 : targetDomain === 'HealthTech' ? 8 : targetDomain === 'FinTech' ? 12 : 6;
			const score = Math.min(100, scoreBase + completenessBonus + domainBonus);

			setAnalysis({
				score,
				summary:
					user?.startupProfile?.problem && user?.startupProfile?.solution
						? `Strong thesis addressing "${user.startupProfile.problem.slice(0, 80)}...". Solution narrative is validated with target ${user.startupProfile.startupStage || 'Seed'} milestones.`
						: 'The business shows a focused value proposition, a credible buyer pain point, and an attractive expansion path within the selected domain. The strongest next move is to sharpen traction storytelling and investor targeting.',
				domain: targetDomain,
			});
			setAnalyzing(false);
			setNotification('Analysis complete. Investor outreach recommendations ready.');
			setNotificationType('success');
		}, 900);
	};

	const handleSendMessage = () => {
		if (!chatInput.trim()) return;

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

	const currentDeck = user.startupProfile?.pitchDeck;
	const currentDeckUrl = user.startupProfile?.pitchDeckUrl;

	return (
		<main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
			<div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
				{/* Left Sidebar Workspace */}
				<aside className="glass-panel rounded-[2rem] p-5 sm:p-6 lg:sticky lg:top-6 lg:h-fit">
					<div className="space-y-5">
						<div>
							<p className="text-xs uppercase tracking-[0.3em] text-teal-300">Founder Workspace</p>
							<h1 className="mt-2 font-display text-3xl font-bold text-white">Startup Hub</h1>
							<p className="mt-2 text-sm leading-6 text-slate-300">
								Manage company assets, upload pitch decks, and align fundraising narratives with target VCs.
							</p>
						</div>

						{/* Profile Completeness Card */}
						<div className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
							<div className="flex items-center justify-between">
								<span className="text-xs uppercase tracking-[0.2em] text-slate-400">Profile Completeness</span>
								<span className="text-xs font-bold text-teal-300">{profileCompleteness}%</span>
							</div>
							<div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
								<div
									className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-500"
									style={{ width: `${profileCompleteness}%` }}
								/>
							</div>
							<button
								type="button"
								onClick={() => setIsEditOpen(true)}
								className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
							>
								✎ Edit Startup Profile
							</button>
						</div>

						{/* Pitch Deck Upload Section */}
						<div className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
							<div className="mb-3 flex items-center justify-between gap-3">
								<div>
									<p className="text-xs uppercase tracking-[0.28em] text-teal-300">Pitch Deck Asset</p>
									<p className="mt-1 text-xs text-slate-300">PDF Document (Max 10MB)</p>
								</div>
								<span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">PDF</span>
							</div>

							{currentDeck || currentDeckUrl ? (
								<div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-4">
									<div className="flex items-start justify-between gap-2">
										<div>
											<p className="text-xs font-semibold text-teal-200">
												📄 {currentDeck?.originalName || 'Pitch_Deck.pdf'}
											</p>
											{currentDeck?.fileSize ? (
												<p className="mt-1 text-[0.7rem] text-slate-400">
													{(currentDeck.fileSize / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(currentDeck.uploadedAt || Date.now()).toLocaleDateString()}
												</p>
											) : (
												<p className="mt-1 text-[0.7rem] text-slate-400">Deck Linked</p>
											)}
										</div>
										<span className="rounded-md bg-teal-400/20 px-2 py-0.5 text-[0.65rem] font-bold text-teal-300">
											SAVED
										</span>
									</div>

									<div className="mt-3 flex gap-2">
										<label className="flex-1 cursor-pointer rounded-xl border border-white/10 bg-white/5 py-1.5 text-center text-xs font-medium text-slate-200 transition hover:bg-white/10">
											<input type="file" accept="application/pdf" className="hidden" onChange={handlePitchDeckUpload} disabled={uploadingDeck} />
											{uploadingDeck ? 'Uploading...' : 'Replace'}
										</label>
										<button
											type="button"
											onClick={handleDeletePitchDeck}
											disabled={uploadingDeck}
											className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300 transition hover:bg-rose-500/20"
										>
											Delete
										</button>
									</div>
								</div>
							) : (
								<label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center transition hover:border-teal-400/50 hover:bg-white/10">
									<input type="file" accept="application/pdf" className="hidden" onChange={handlePitchDeckUpload} disabled={uploadingDeck} />
									<span className="text-sm font-semibold text-white">{uploadingDeck ? 'Uploading deck...' : 'Upload PDF Pitch Deck'}</span>
									<span className="mt-1 text-[0.7rem] leading-4 text-slate-400">Click to browse or drop file</span>
								</label>
							)}

							<button
								className="primary-button mt-4 w-full"
								type="button"
								onClick={analyzeDeck}
								disabled={analyzing}
							>
								{analyzing ? 'Analyzing Deck...' : 'Run Pitch Analysis'}
							</button>
						</div>

						{/* Assistant Quick Prompts */}
						<div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
							<div className="flex items-center justify-between gap-3">
								<p className="text-xs uppercase tracking-[0.28em] text-gold">Assistant Prompts</p>
								<span className="text-xs text-slate-400">Quick actions</span>
							</div>
							<div className="mt-3 grid gap-2">
								{sampleSuggestions.map((prompt) => (
									<button
										key={prompt}
										className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-left text-xs text-slate-200 transition hover:bg-white/10"
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

				{/* Right Main Content */}
				<section className="space-y-6">
					{/* Workspace Header */}
					<header className="glass-panel rounded-[2rem] p-6 sm:p-8">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<div className="flex items-center gap-2">
									<p className="text-sm uppercase tracking-[0.3em] text-teal-300">{user.role} Workspace</p>
									{user.isVerified && (
										<span className="rounded-full bg-teal-400/15 px-2 py-0.5 text-[0.65rem] font-semibold text-teal-300">
											✓ Verified
										</span>
									)}
								</div>
								<h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
									{user.startupProfile?.companyName || user.fullName}
								</h2>
								<p className="mt-1 text-sm text-gold font-medium">
									{user.startupProfile?.tagline || 'Innovative Early-Stage Startup'}
								</p>
								<p className="mt-2 max-w-2xl text-xs leading-6 text-slate-300">
									{user.bio || 'Provide a company mission statement to help investors discover your venture.'}
								</p>
							</div>

							<div className="flex flex-wrap gap-2.5">
								<StatChip label="Industry" value={user.startupProfile?.industry || targetDomain} />
								<StatChip label="Stage" value={user.startupProfile?.startupStage || 'Seed'} />
								{user.startupProfile?.fundingTarget ? (
									<StatChip label="Target" value={`$${Number(user.startupProfile.fundingTarget).toLocaleString()}`} />
								) : null}
							</div>
						</div>

						{notification ? (
							<div
								className={`mt-4 rounded-xl border px-4 py-3 text-xs ${
									notificationType === 'success'
										? 'border-teal-500/30 bg-teal-500/10 text-teal-200'
										: notificationType === 'error'
										? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
										: 'border-white/10 bg-white/5 text-slate-200'
								}`}
							>
								{notification}
							</div>
						) : null}
					</header>

					{/* Persistent Business Profile Details Card */}
					<div className="glass-panel rounded-[2rem] p-6 sm:p-8">
						<div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
							<div>
								<p className="text-xs uppercase tracking-[0.28em] text-gold">Executive Summary</p>
								<h3 className="mt-1 text-xl font-bold text-white">Startup Overview & Business Plan</h3>
							</div>
							<button
								type="button"
								onClick={() => setIsEditOpen(true)}
								className="primary-button text-xs py-2 px-4"
							>
								✎ Edit Business Details
							</button>
						</div>

						<div className="grid gap-6 md:grid-cols-3">
							<div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
								<p className="text-xs uppercase tracking-[0.2em] text-rose-300">The Problem</p>
								<p className="mt-2 text-xs leading-6 text-slate-300">
									{user.startupProfile?.problem || 'No problem statement defined yet. Click edit to describe user pain points.'}
								</p>
							</div>

							<div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
								<p className="text-xs uppercase tracking-[0.2em] text-teal-300">The Solution</p>
								<p className="mt-2 text-xs leading-6 text-slate-300">
									{user.startupProfile?.solution || 'No solution details defined yet. Click edit to explain your product thesis.'}
								</p>
							</div>

							<div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
								<p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Business Model</p>
								<p className="mt-2 text-xs leading-6 text-slate-300">
									{user.startupProfile?.businessModel || 'No monetization model defined yet. Click edit to specify pricing and sales channels.'}
								</p>
							</div>
						</div>

						{/* Startup Quick Facts Bar */}
						<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-white/10 pt-5">
							<div>
								<span className="text-[0.65rem] uppercase tracking-wider text-slate-400">Location</span>
								<p className="mt-1 text-xs font-semibold text-white">{user.location || 'Not specified'}</p>
							</div>
							<div>
								<span className="text-[0.65rem] uppercase tracking-wider text-slate-400">Team Size</span>
								<p className="mt-1 text-xs font-semibold text-white">{user.startupProfile?.teamSize ? `${user.startupProfile.teamSize} members` : 'Not specified'}</p>
							</div>
							<div>
								<span className="text-[0.65rem] uppercase tracking-wider text-slate-400">Founding Year</span>
								<p className="mt-1 text-xs font-semibold text-white">{user.startupProfile?.foundingYear || 'Not specified'}</p>
							</div>
							<div>
								<span className="text-[0.65rem] uppercase tracking-wider text-slate-400">Website</span>
								<p className="mt-1 text-xs font-semibold text-white truncate">
									{user.startupProfile?.websiteUrl ? (
										<a href={user.startupProfile.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-teal-300 hover:underline">
											{user.startupProfile.websiteUrl.replace(/^https?:\/\//, '')}
										</a>
									) : (
										'Not specified'
									)}
								</p>
							</div>
						</div>
					</div>

					{/* AI Pitch Analyst & Metrics Section */}
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
										<span className="text-xs text-slate-300">Domain: {targetDomain}</span>
									</div>
								</div>

								<div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center">
									<GaugeChart value={analysis?.score || 0} color={gaugeColor} />
									<div className="space-y-3">
										<div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
											<p className="text-xs uppercase tracking-[0.2em] text-teal-300">Analysis Summary</p>
											<p className="mt-2 text-xs leading-6 text-slate-200">
												{analysis?.summary || 'Upload your pitch deck or save business details to compute an automated opportunity evaluation.'}
											</p>
										</div>

										<div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
											<div className="flex items-center justify-between gap-3">
												<div>
													<p className="text-xs uppercase tracking-[0.2em] text-gold">Target Investors</p>
													<p className="mt-1 text-xs text-slate-300">Connect directly with active funds in {targetDomain}.</p>
												</div>
												<a href="#investor-discovery" className="primary-button text-xs py-1.5 px-3">
													Explore ↓
												</a>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Chatbox */}
						<div className="glass-panel rounded-[2rem] p-5 sm:p-6">
							<div className="mb-4 flex items-center justify-between gap-3">
								<div>
									<p className="text-xs uppercase tracking-[0.28em] text-teal-300">AI Pitch Analyst</p>
									<h3 className="mt-1 text-lg font-semibold text-white">Interactive Copilot</h3>
								</div>
								<span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">AI</span>
							</div>

							<div className="flex h-[420px] flex-col rounded-2xl border border-white/10 bg-slate-950/55">
								<div className="flex-1 space-y-3 overflow-y-auto p-4">
									{messages.map((message, index) => (
										<ChatBubble key={`${message.role}-${index}`} role={message.role} text={message.text} />
									))}
								</div>

								<div className="border-t border-white/10 p-3">
									<textarea
										className="input-field min-h-[70px] resize-none text-xs"
										value={chatInput}
										onChange={(event) => setChatInput(event.target.value)}
										placeholder="Ask about fundraising strategy, valuation, or positioning..."
									/>
									<button className="primary-button mt-2 w-full py-2 text-xs" type="button" onClick={handleSendMessage}>
										Send Question
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

			{/* Edit Startup Profile Modal */}
			{isEditOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
					<div className="glass-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] p-6 sm:p-8">
						<div className="flex items-center justify-between border-b border-white/10 pb-4">
							<div>
								<p className="text-xs uppercase tracking-[0.28em] text-teal-300">Founder Workspace</p>
								<h3 className="mt-1 text-2xl font-bold text-white">Edit Startup Profile</h3>
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
									<label className="text-xs font-semibold text-slate-300">Founder Name</label>
									<input
										type="text"
										required
										className="input-field mt-1 text-sm"
										value={formData.fullName}
										onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
									/>
								</div>

								<div>
									<label className="text-xs font-semibold text-slate-300">Startup / Company Name</label>
									<input
										type="text"
										required
										className="input-field mt-1 text-sm"
										value={formData.companyName}
										onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
									/>
								</div>
							</div>

							<div>
								<label className="text-xs font-semibold text-slate-300">One-Line Tagline</label>
								<input
									type="text"
									placeholder="e.g. Next-generation telemetry for clean mobility"
									className="input-field mt-1 text-sm"
									value={formData.tagline}
									onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
								/>
							</div>

							<div className="grid gap-4 sm:grid-cols-3">
								<div>
									<label className="text-xs font-semibold text-slate-300">Industry / Domain</label>
									<select
										className="input-field mt-1 text-sm bg-slate-900"
										value={formData.industry}
										onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
									>
										{industryOptions.map((opt) => (
											<option key={opt} value={opt}>{opt}</option>
										))}
									</select>
								</div>

								<div>
									<label className="text-xs font-semibold text-slate-300">Funding Stage</label>
									<select
										className="input-field mt-1 text-sm bg-slate-900"
										value={formData.startupStage}
										onChange={(e) => setFormData({ ...formData, startupStage: e.target.value })}
									>
										{stageOptions.map((opt) => (
											<option key={opt} value={opt}>{opt}</option>
										))}
									</select>
								</div>

								<div>
									<label className="text-xs font-semibold text-slate-300">Funding Target ($)</label>
									<input
										type="number"
										min="0"
										placeholder="e.g. 500000"
										className="input-field mt-1 text-sm"
										value={formData.fundingTarget}
										onChange={(e) => setFormData({ ...formData, fundingTarget: e.target.value })}
									/>
								</div>
							</div>

							<div className="grid gap-4 sm:grid-cols-3">
								<div>
									<label className="text-xs font-semibold text-slate-300">Location</label>
									<input
										type="text"
										placeholder="e.g. San Francisco, CA"
										className="input-field mt-1 text-sm"
										value={formData.location}
										onChange={(e) => setFormData({ ...formData, location: e.target.value })}
									/>
								</div>

								<div>
									<label className="text-xs font-semibold text-slate-300">Team Size</label>
									<input
										type="number"
										min="1"
										placeholder="e.g. 5"
										className="input-field mt-1 text-sm"
										value={formData.teamSize}
										onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
									/>
								</div>

								<div>
									<label className="text-xs font-semibold text-slate-300">Founding Year</label>
									<input
										type="number"
										min="1900"
										max={new Date().getFullYear()}
										placeholder="e.g. 2024"
										className="input-field mt-1 text-sm"
										value={formData.foundingYear}
										onChange={(e) => setFormData({ ...formData, foundingYear: e.target.value })}
									/>
								</div>
							</div>

							<div>
								<label className="text-xs font-semibold text-slate-300">Website URL</label>
								<input
									type="url"
									placeholder="https://yourstartup.io"
									className="input-field mt-1 text-sm"
									value={formData.websiteUrl}
									onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
								/>
							</div>

							<div>
								<label className="text-xs font-semibold text-slate-300">Company Bio / Mission</label>
								<textarea
									rows={2}
									placeholder="Summary of your startup vision..."
									className="input-field mt-1 text-sm resize-none"
									value={formData.bio}
									onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
								/>
							</div>

							<div>
								<label className="text-xs font-semibold text-slate-300">Problem Statement</label>
								<textarea
									rows={2}
									placeholder="What critical market friction are you solving?"
									className="input-field mt-1 text-sm resize-none"
									value={formData.problem}
									onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
								/>
							</div>

							<div>
								<label className="text-xs font-semibold text-slate-300">Solution Description</label>
								<textarea
									rows={2}
									placeholder="How does your product solve the problem uniquely?"
									className="input-field mt-1 text-sm resize-none"
									value={formData.solution}
									onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
								/>
							</div>

							<div>
								<label className="text-xs font-semibold text-slate-300">Business & Monetization Model</label>
								<textarea
									rows={2}
									placeholder="e.g. B2B SaaS subscription + transaction volume fee"
									className="input-field mt-1 text-sm resize-none"
									value={formData.businessModel}
									onChange={(e) => setFormData({ ...formData, businessModel: e.target.value })}
								/>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label className="text-xs font-semibold text-slate-300">Core Technologies / Skills</label>
									<input
										type="text"
										placeholder="e.g. React, Node, AI, Telemetry (comma-separated)"
										className="input-field mt-1 text-sm"
										value={formData.skills}
										onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
									/>
								</div>

								<div>
									<label className="text-xs font-semibold text-slate-300">Market Categories / Interests</label>
									<input
										type="text"
										placeholder="e.g. Climate, Mobility, DeepTech (comma-separated)"
										className="input-field mt-1 text-sm"
										value={formData.interests}
										onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
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
									{savingProfile ? 'Saving to Database...' : 'Save Changes'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
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
			<div className="relative h-[200px] w-[200px]">
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
					<p className="text-xs uppercase tracking-[0.3em] text-slate-400">Market score</p>
					<p className="mt-2 font-display text-4xl font-bold text-white">{safeValue}%</p>
					<p className="mt-1 text-[0.65rem] text-slate-400">Opportunity rating</p>
				</div>
			</div>
		</div>
	);
};

const StatChip = ({ label, value }) => (
	<div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-left">
		<p className="text-[0.65rem] uppercase tracking-[0.28em] text-slate-400">{label}</p>
		<p className="mt-0.5 text-xs font-semibold text-white">{value}</p>
	</div>
);

const ChatBubble = ({ role, text }) => (
	<div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
		<div
			className={`max-w-[85%] rounded-[1.25rem] px-3.5 py-2.5 text-xs leading-5 ${
				role === 'user' ? 'bg-gold text-slate-950 font-medium' : 'border border-white/10 bg-white/5 text-slate-100'
			}`}
		>
			<p className="mb-1 text-[0.6rem] uppercase tracking-[0.25em] opacity-70">{role === 'user' ? 'You' : 'AI Pitch Analyst'}</p>
			<p>{text}</p>
		</div>
	</div>
);

export default StartupDashboard;
