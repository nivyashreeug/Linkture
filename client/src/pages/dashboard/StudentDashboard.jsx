import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import ConnectionActions from '../../components/ConnectionActions';
import NetworkHub from '../../components/NetworkHub';

const roadmapSteps = [
	{
		title: 'Idea Validation',
		description: 'Test the problem, confirm user pain, and define the first target audience.',
		focus: 'Customer interviews',
	},
	{
		title: 'MVP Development',
		description: 'Build the minimum product that proves the workflow and core value proposition.',
		focus: 'Prototype and feedback loops',
	},
	{
		title: 'Legal Incorporation',
		description: 'Register the company, formalize ownership, and set up the operating structure.',
		focus: 'Compliance and entity setup',
	},
	{
		title: 'Pitching',
		description: 'Refine the deck, practice the narrative, and begin investor and mentor outreach.',
		focus: 'Fundraising readiness',
	},
];

const lessonLibrary = [
	{
		id: 1,
		title: 'How to start a good startup',
		category: 'Foundations',
		duration: '18 min',
		description: 'Learn how to identify a real problem, choose a strong market, and avoid common early-stage mistakes.',
	},
	{
		id: 2,
		title: 'Scaling for Success',
		category: 'Growth',
		duration: '24 min',
		description: 'Understand the signals that indicate product-market fit and when to shift from validation to growth.',
	},
	{
		id: 3,
		title: 'Building a Pitch Deck That Wins',
		category: 'Fundraising',
		duration: '21 min',
		description: 'Structure your story so mentors and investors quickly understand the opportunity and your traction.',
	},
	{
		id: 4,
		title: 'Customer Discovery for Student Founders',
		category: 'Research',
		duration: '15 min',
		description: 'Use interviews, surveys, and lightweight experiments to validate demand before overbuilding.',
	},
	{
		id: 5,
		title: 'Go-to-Market Basics',
		category: 'Distribution',
		duration: '20 min',
		description: 'Map the channels, messaging, and early acquisition loops that help your startup reach its first users.',
	},
	{
		id: 6,
		title: 'Startup Legal and Compliance 101',
		category: 'Operations',
		duration: '17 min',
		description: 'Cover incorporation, founder agreements, IP basics, and operational hygiene for a student startup.',
	},
];

const StudentDashboard = () => {
	const { user, logout, setUser } = useAuth();
	const [completedLessons, setCompletedLessons] = useState([]);
	const [savedLessons, setSavedLessons] = useState([]);
	const [selectedCategory, setSelectedCategory] = useState('All');
	const [notification, setNotification] = useState('');

	// Edit Profile Modal State
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [savingProfile, setSavingProfile] = useState(false);
	const [editError, setEditError] = useState('');
	const [formData, setFormData] = useState({
		fullName: '',
		institutionName: '',
		program: '',
		graduationYear: '',
		incubatorName: '',
		bio: '',
		location: '',
		skills: '',
		interests: '',
		projectLinks: '',
	});

	// Phase 2 Matching and Discovery State
	const [matches, setMatches] = useState([]);
	const [matchesLoading, setMatchesLoading] = useState(false);
	const [startups, setStartups] = useState([]);
	const [startupsLoading, setStartupsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	// Load persisted lesson progress from user model
	useEffect(() => {
		if (user?.studentProfile) {
			setCompletedLessons(user.studentProfile.completedLessons || []);
			setSavedLessons(user.studentProfile.savedLessons || []);
		}
	}, [user]);

	// Sync modal form fields
	useEffect(() => {
		if (user) {
			const stp = user.studentProfile || {};
			setFormData({
				fullName: user.fullName || '',
				institutionName: stp.institutionName || user.roleDetails?.student?.education || '',
				program: stp.program || '',
				graduationYear: stp.graduationYear || '',
				incubatorName: stp.incubatorName || '',
				bio: user.bio || '',
				location: user.location || '',
				skills: Array.isArray(user.skills) ? user.skills.join(', ') : '',
				interests: Array.isArray(user.interests) ? user.interests.join(', ') : '',
				projectLinks: Array.isArray(stp.projectLinks) ? stp.projectLinks.join(', ') : '',
			});
		}
	}, [user, isEditOpen]);

	const completionPercentage = useMemo(() => {
		return Math.round((completedLessons.length / lessonLibrary.length) * 100);
	}, [completedLessons]);

	const progressLabel =
		completionPercentage >= 75 ? 'Advanced' : completionPercentage >= 40 ? 'In progress' : 'Getting started';

	const toggleLessonCompletion = async (lessonId) => {
		const updated = completedLessons.includes(lessonId)
			? completedLessons.filter((id) => id !== lessonId)
			: [...completedLessons, lessonId];

		setCompletedLessons(updated);

		try {
			const res = await api.put('/profile', {
				studentProfile: {
					completedLessons: updated,
					savedLessons,
				},
			});
			if (res.data.user) {
				setUser(res.data.user);
			}
		} catch (err) {
			console.error('Failed to persist lesson completion:', err);
		}
	};

	const toggleLessonBookmark = async (lessonId) => {
		const updated = savedLessons.includes(lessonId)
			? savedLessons.filter((id) => id !== lessonId)
			: [...savedLessons, lessonId];

		setSavedLessons(updated);

		try {
			const res = await api.put('/profile', {
				studentProfile: {
					completedLessons,
					savedLessons: updated,
				},
			});
			if (res.data.user) {
				setUser(res.data.user);
			}
		} catch (err) {
			console.error('Failed to persist lesson bookmark:', err);
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
				studentProfile: {
					institutionName: formData.institutionName.trim(),
					program: formData.program.trim(),
					graduationYear: formData.graduationYear ? Number(formData.graduationYear) : undefined,
					incubatorName: formData.incubatorName.trim(),
					projectLinks: formData.projectLinks ? formData.projectLinks.split(',').map((p) => p.trim()).filter(Boolean) : [],
					completedLessons,
					savedLessons,
				},
			};

			const response = await api.put('/profile', payload);
			setUser(response.data.user);
			setIsEditOpen(false);
			setNotification('Student workspace profile updated and saved to database.');
			setTimeout(() => setNotification(''), 4000);
		} catch (err) {
			console.error('Failed to update student profile:', err);
			setEditError(err.response?.data?.message || 'Failed to update student profile.');
		} finally {
			setSavingProfile(false);
		}
	};

	const fetchMatches = async () => {
		try {
			setMatchesLoading(true);
			const res = await api.get('/match');
			setMatches(res.data.matches || []);
		} catch (err) {
			console.error('Failed to fetch recommended matches:', err);
		} finally {
			setMatchesLoading(false);
		}
	};

	const fetchStartups = async () => {
		try {
			setStartupsLoading(true);
			const params = new URLSearchParams();
			if (searchQuery.trim()) params.append('q', searchQuery.trim());
			params.append('page', page);
			params.append('limit', 4);

			const res = await api.get(`/users/startups?${params.toString()}`);
			setStartups(res.data.data?.startups || []);
			setTotalPages(res.data.data?.pagination?.totalPages || 1);
		} catch (err) {
			console.error('Failed to fetch startups discovery:', err);
		} finally {
			setStartupsLoading(false);
		}
	};

	useEffect(() => {
		if (user?.role === 'Student') {
			fetchMatches();
			fetchStartups();
		}
	}, [user, page, searchQuery]);

	const filteredLessons = useMemo(() => {
		if (selectedCategory === 'Saved') {
			return lessonLibrary.filter((lesson) => savedLessons.includes(lesson.id));
		}
		if (selectedCategory === 'Completed') {
			return lessonLibrary.filter((lesson) => completedLessons.includes(lesson.id));
		}
		if (selectedCategory === 'All') {
			return lessonLibrary;
		}
		return lessonLibrary.filter((lesson) => lesson.category === selectedCategory);
	}, [selectedCategory, completedLessons, savedLessons]);

	if (!user) {
		return null;
	}

	const stp = user.studentProfile || {};
	const university = stp.institutionName || 'University / Academic Program';
	const program = stp.program || 'Student Founder';

	return (
		<main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl space-y-6">
				{/* Student Header */}
				<header className="glass-panel rounded-[2rem] p-6 sm:p-8">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<div className="flex items-center gap-2">
								<p className="text-xs uppercase tracking-[0.3em] text-teal-300">Student Founder Workspace</p>
								{stp.incubatorName && (
									<span className="rounded-full bg-teal-400/15 px-2.5 py-0.5 text-[0.65rem] font-semibold text-teal-200">
										🏛 {stp.incubatorName}
									</span>
								)}
							</div>
							<h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
								{user.fullName}
							</h1>
							<p className="mt-1 text-sm font-semibold text-gold">
								{program} • {university} {stp.graduationYear ? `(Class of ${stp.graduationYear})` : ''}
							</p>
							<p className="mt-2 max-w-2xl text-xs leading-6 text-slate-300">
								{user.bio || 'Develop entrepreneurial skills, progress through startup milestones, and connect with peer founders and mentors.'}
							</p>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<button
								type="button"
								onClick={() => setIsEditOpen(true)}
								className="primary-button text-xs py-2 px-4"
							>
								✎ Edit Profile
							</button>
							<button className="ghost-button text-xs py-2 px-4" type="button" onClick={logout}>
								Logout
							</button>
						</div>
					</div>

					{/* Quick Details Bar */}
					<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-white/10 pt-5">
						<div className="rounded-xl border border-white/10 bg-white/5 p-3">
							<span className="text-[0.65rem] uppercase tracking-wider text-slate-400">Curriculum Progress</span>
							<p className="mt-1 text-xs font-bold text-teal-300">
								{completedLessons.length} / {lessonLibrary.length} Lessons ({completionPercentage}%)
							</p>
						</div>
						<div className="rounded-xl border border-white/10 bg-white/5 p-3">
							<span className="text-[0.65rem] uppercase tracking-wider text-slate-400">Bookmarked Lessons</span>
							<p className="mt-1 text-xs font-bold text-gold">{savedLessons.length} Saved</p>
						</div>
						<div className="rounded-xl border border-white/10 bg-white/5 p-3">
							<span className="text-[0.65rem] uppercase tracking-wider text-slate-400">Location</span>
							<p className="mt-1 text-xs font-bold text-white truncate">{user.location || 'Not specified'}</p>
						</div>
						<div className="rounded-xl border border-white/10 bg-white/5 p-3">
							<span className="text-[0.65rem] uppercase tracking-wider text-slate-400">Status</span>
							<p className="mt-1 text-xs font-bold text-white">{progressLabel}</p>
						</div>
					</div>

					{notification && (
						<div className="mt-4 rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3 text-xs text-teal-200">
							{notification}
						</div>
					)}
				</header>

				{/* Student Skills & Interests Card */}
				{(user.skills?.length || user.interests?.length || stp.projectLinks?.length) ? (
					<section className="glass-panel rounded-[2rem] p-5 sm:p-6">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div>
								<p className="text-xs uppercase tracking-[0.28em] text-teal-300">Background & Competencies</p>
								<h3 className="mt-1 text-lg font-bold text-white">Skills & Project Portfolio</h3>
							</div>
						</div>
						<div className="mt-4 grid gap-4 md:grid-cols-3">
							{user.skills?.length ? (
								<div className="rounded-xl border border-white/10 bg-white/5 p-3">
									<p className="text-[0.65rem] uppercase tracking-wider text-slate-400">Technical / Domain Skills</p>
									<div className="mt-2 flex flex-wrap gap-1.5">
										{user.skills.map((sk) => (
											<span key={sk} className="rounded bg-teal-400/15 px-2 py-0.5 text-xs text-teal-200">
												{sk}
											</span>
										))}
									</div>
								</div>
							) : null}

							{user.interests?.length ? (
								<div className="rounded-xl border border-white/10 bg-white/5 p-3">
									<p className="text-[0.65rem] uppercase tracking-wider text-slate-400">Industry Interests</p>
									<div className="mt-2 flex flex-wrap gap-1.5">
										{user.interests.map((it) => (
											<span key={it} className="rounded bg-cyan-400/15 px-2 py-0.5 text-xs text-cyan-200">
												{it}
											</span>
										))}
									</div>
								</div>
							) : null}

							{stp.projectLinks?.length ? (
								<div className="rounded-xl border border-white/10 bg-white/5 p-3">
									<p className="text-[0.65rem] uppercase tracking-wider text-slate-400">Project / Portfolio Links</p>
									<div className="mt-2 space-y-1">
										{stp.projectLinks.map((link) => (
											<a
												key={link}
												href={link.startsWith('http') ? link : `https://${link}`}
												target="_blank"
												rel="noopener noreferrer"
												className="block truncate text-xs text-teal-300 hover:underline"
											>
												🔗 {link.replace(/^https?:\/\//, '')}
											</a>
										))}
									</div>
								</div>
							) : null}
						</div>
					</section>
				) : null}

				{/* Startup Launch Roadmap */}
				<section className="glass-panel rounded-[2rem] p-6 sm:p-8">
					<div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
						<div>
							<p className="text-xs uppercase tracking-[0.28em] text-teal-300">Founder Milestones</p>
							<h2 className="mt-1 text-2xl font-bold text-white">Startup Launch Roadmap</h2>
						</div>
						<span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
							Phase 1 of 4
						</span>
					</div>

					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{roadmapSteps.map((step, index) => (
							<div
								key={step.title}
								className="relative rounded-2xl border border-white/10 bg-slate-950/40 p-5 transition hover:border-white/20"
							>
								<div className="flex items-center justify-between">
									<span className="font-mono text-xs font-bold text-gold">STEP 0{index + 1}</span>
									<span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] text-slate-300">
										{index === 0 ? 'Active' : 'Upcoming'}
									</span>
								</div>
								<h3 className="mt-3 text-base font-bold text-white">{step.title}</h3>
								<p className="mt-2 text-xs leading-5 text-slate-300">{step.description}</p>
								<div className="mt-4 border-t border-white/10 pt-3">
									<p className="text-[0.65rem] uppercase tracking-wider text-teal-300 font-semibold">Key Focus</p>
									<p className="mt-0.5 text-xs text-slate-200">{step.focus}</p>
								</div>
							</div>
						))}
					</div>
				</section>

				{/* Persistent Learning & Lesson Area */}
				<section className="glass-panel rounded-[2rem] p-6 sm:p-8">
					<div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
							<div>
								<p className="text-xs uppercase tracking-[0.28em] text-gold">Learning Curriculum</p>
								<h2 className="mt-1 text-2xl font-bold text-white">Startup Playbooks & Resources</h2>
							</div>

							{/* Category & Saved Filter Pills */}
							<div className="flex flex-wrap gap-1.5">
								{['All', 'Saved', 'Completed', 'Foundations', 'Growth', 'Fundraising'].map((cat) => (
									<button
										key={cat}
										type="button"
										onClick={() => setSelectedCategory(cat)}
										className={`rounded-xl border px-3 py-1 text-xs font-medium transition ${
											selectedCategory === cat
												? 'border-gold bg-gold/20 text-gold font-bold'
												: 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
										}`}
									>
										{cat === 'Saved' ? `★ Saved (${savedLessons.length})` : cat}
									</button>
								))}
							</div>
						</div>
					</div>

					{filteredLessons.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-xs text-slate-400">
							No lessons found for category "{selectedCategory}".
						</div>
					) : (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{filteredLessons.map((lesson) => {
								const isDone = completedLessons.includes(lesson.id);
								const isSaved = savedLessons.includes(lesson.id);

								return (
									<div
										key={lesson.id}
										className={`flex flex-col justify-between rounded-2xl border p-5 transition ${
											isDone
												? 'border-teal-500/40 bg-teal-500/5'
												: 'border-white/10 bg-slate-950/40 hover:border-white/20'
										}`}
									>
										<div>
											<div className="flex items-start justify-between gap-2">
												<span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[0.65rem] font-medium text-teal-300">
													{lesson.category}
												</span>
												<div className="flex items-center gap-1.5">
													<button
														type="button"
														onClick={() => toggleLessonBookmark(lesson.id)}
														className={`rounded-lg p-1 text-xs transition ${
															isSaved ? 'text-gold' : 'text-slate-500 hover:text-slate-300'
														}`}
														title={isSaved ? 'Remove Bookmark' : 'Save Lesson'}
													>
														{isSaved ? '★' : '☆'}
													</button>
													<span className="text-[0.65rem] text-slate-400">⏱ {lesson.duration}</span>
												</div>
											</div>

											<h3 className="mt-2.5 text-base font-bold text-white">{lesson.title}</h3>
											<p className="mt-2 text-xs leading-5 text-slate-300">{lesson.description}</p>
										</div>

										<div className="mt-5 border-t border-white/10 pt-3 flex items-center justify-between">
											<button
												type="button"
												onClick={() => toggleLessonCompletion(lesson.id)}
												className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
													isDone
														? 'border-teal-400 bg-teal-400 text-slate-950 hover:bg-teal-300'
														: 'border-white/15 bg-white/5 text-slate-200 hover:bg-white/10'
												}`}
											>
												{isDone ? '✓ Completed' : 'Mark as Done'}
											</button>
											{isDone && (
												<span className="text-[0.65rem] font-bold text-teal-300">
													SAVED TO PROFILE
												</span>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</section>

				{/* Live Network & Requests */}
				<NetworkHub title="Student Collaborations & Network Requests" />

				{/* Recommended Startup Matches (Phase 2) */}
				<section className="glass-panel rounded-[2rem] p-6 sm:p-8">
					<div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
						<div>
							<p className="text-xs uppercase tracking-[0.28em] text-teal-300">AI Matching Engine</p>
							<h2 className="mt-1 text-2xl font-bold text-white">Recommended Startup Matches</h2>
						</div>
						<span className="rounded-full bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-200">
							Complementary Roles
						</span>
					</div>

					{matchesLoading ? (
						<p className="py-8 text-center text-xs text-slate-400">Loading startup matches...</p>
					) : matches.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-xs text-slate-400">
							No recommendations found. Add more skills and interests to your profile.
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
												<p className="text-xs uppercase tracking-[0.28em] text-gold">{match.domain || 'Startup'}</p>
												<h3 className="mt-1 text-lg font-bold text-white">{match.name}</h3>
											</div>
											<span className="rounded-full bg-teal-400/15 px-2.5 py-1 text-xs font-bold text-teal-200">
												{match.matchScore} pts
											</span>
										</div>
										<p className="mt-2 text-xs text-slate-300 line-clamp-2">{match.bio}</p>
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
				</section>

				{/* Live Startup Discovery (Phase 2) */}
				<section className="glass-panel rounded-[2rem] p-6 sm:p-8">
					<div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
							<div>
								<p className="text-xs uppercase tracking-[0.28em] text-rose-300">Discovery Engine</p>
								<h2 className="mt-1 text-2xl font-bold text-white">Explore Early-Stage Startups</h2>
							</div>
							<p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
						</div>

						<div>
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setPage(1);
								}}
								placeholder="Search startups by keyword, industry, or project..."
								className="input-field text-sm"
							/>
						</div>
					</div>

					{startupsLoading ? (
						<p className="py-8 text-center text-xs text-slate-400">Loading startups...</p>
					) : startups.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-xs text-slate-400">
							No startups found matching your query.
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2">
							{startups.map((s) => (
								<div
									key={s.id || s._id}
									className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-5"
								>
									<div>
										<div className="flex items-start justify-between gap-3">
											<div>
												<p className="text-xs uppercase tracking-[0.28em] text-slate-400">{s.domain}</p>
												<h3 className="mt-1 text-lg font-bold text-white">{s.name}</h3>
											</div>
											<span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-200">
												{s.stage || 'Seed'}
											</span>
										</div>
										<p className="mt-2 text-xs text-slate-300 line-clamp-2">{s.summary || s.bio}</p>
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
				</section>
			</div>

			{/* Edit Student Profile Modal */}
			{isEditOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
					<div className="glass-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] p-6 sm:p-8">
						<div className="flex items-center justify-between border-b border-white/10 pb-4">
							<div>
								<p className="text-xs uppercase tracking-[0.28em] text-teal-300">Student Workspace</p>
								<h3 className="mt-1 text-2xl font-bold text-white">Edit Student Profile</h3>
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
									<label className="text-xs font-semibold text-slate-300">Full Name</label>
									<input
										type="text"
										required
										className="input-field mt-1 text-sm"
										value={formData.fullName}
										onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
									/>
								</div>

								<div>
									<label className="text-xs font-semibold text-slate-300">Institution / University</label>
									<input
										type="text"
										required
										placeholder="e.g. Stanford University"
										className="input-field mt-1 text-sm"
										value={formData.institutionName}
										onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
									/>
								</div>
							</div>

							<div className="grid gap-4 sm:grid-cols-3">
								<div>
									<label className="text-xs font-semibold text-slate-300">Academic Program / Major</label>
									<input
										type="text"
										placeholder="e.g. B.S. Computer Science"
										className="input-field mt-1 text-sm"
										value={formData.program}
										onChange={(e) => setFormData({ ...formData, program: e.target.value })}
									/>
								</div>

								<div>
									<label className="text-xs font-semibold text-slate-300">Graduation Year</label>
									<input
										type="number"
										min="1900"
										max={new Date().getFullYear() + 10}
										placeholder="e.g. 2026"
										className="input-field mt-1 text-sm"
										value={formData.graduationYear}
										onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
									/>
								</div>

								<div>
									<label className="text-xs font-semibold text-slate-300">Incubator / Lab</label>
									<input
										type="text"
										placeholder="e.g. Stanford Launchpad"
										className="input-field mt-1 text-sm"
										value={formData.incubatorName}
										onChange={(e) => setFormData({ ...formData, incubatorName: e.target.value })}
									/>
								</div>
							</div>

							<div>
								<label className="text-xs font-semibold text-slate-300">Bio & Interests</label>
								<textarea
									rows={3}
									placeholder="Tell founders and mentors what you are building or passionate about..."
									className="input-field mt-1 text-sm resize-none"
									value={formData.bio}
									onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
								/>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<label className="text-xs font-semibold text-slate-300">Skills</label>
									<input
										type="text"
										placeholder="e.g. React, Python, Product Design (comma-separated)"
										className="input-field mt-1 text-sm"
										value={formData.skills}
										onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
									/>
								</div>

								<div>
									<label className="text-xs font-semibold text-slate-300">Domain Interests</label>
									<input
										type="text"
										placeholder="e.g. AI, Climate, Fintech (comma-separated)"
										className="input-field mt-1 text-sm"
										value={formData.interests}
										onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
									/>
								</div>
							</div>

							<div>
								<label className="text-xs font-semibold text-slate-300">Location</label>
								<input
									type="text"
									placeholder="e.g. Palo Alto, CA"
									className="input-field mt-1 text-sm"
									value={formData.location}
									onChange={(e) => setFormData({ ...formData, location: e.target.value })}
								/>
							</div>

							<div>
								<label className="text-xs font-semibold text-slate-300">Project / GitHub / Portfolio Links</label>
								<input
									type="text"
									placeholder="e.g. https://github.com/myname/project (comma-separated)"
									className="input-field mt-1 text-sm"
									value={formData.projectLinks}
									onChange={(e) => setFormData({ ...formData, projectLinks: e.target.value })}
								/>
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
									{savingProfile ? 'Saving Profile...' : 'Save Profile'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</main>
	);
};

export default StudentDashboard;
