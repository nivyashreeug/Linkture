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
	const { user, logout } = useAuth();
	const [completedLessons, setCompletedLessons] = useState([1, 4]);

	// Phase 2 Matching and Discovery State
	const [matches, setMatches] = useState([]);
	const [matchesLoading, setMatchesLoading] = useState(false);
	const [startups, setStartups] = useState([]);
	const [startupsLoading, setStartupsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	const completionPercentage = useMemo(() => {
		return Math.round((completedLessons.length / lessonLibrary.length) * 100);
	}, [completedLessons]);

	const progressLabel = completionPercentage >= 75 ? 'Advanced' : completionPercentage >= 40 ? 'In progress' : 'Getting started';

	const toggleLessonCompletion = (lessonId) => {
		setCompletedLessons((current) =>
			current.includes(lessonId) ? current.filter((id) => id !== lessonId) : [...current, lessonId]
		);
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
			console.error('Failed to fetch startups for student:', err);
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

	if (!user) {
		return null;
	}

	return (
		<main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
			<div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
				<aside className="glass-panel rounded-[2rem] p-5 sm:p-6 lg:sticky lg:top-6 lg:h-fit">
					<div className="space-y-5">
						<div>
							<p className="text-xs uppercase tracking-[0.3em] text-slate-400">Student Incubator</p>
							<h1 className="mt-2 font-display text-3xl font-bold text-white">LMS Dashboard</h1>
							<p className="mt-2 text-sm leading-6 text-slate-300">
								Follow your startup curriculum, track progress, and network with active startup founders.
							</p>
						</div>

						<div className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
							<p className="text-xs uppercase tracking-[0.28em] text-teal-300">Progress tracker</p>
							<div className="mt-3 flex items-end justify-between gap-3">
								<div>
									<p className="text-4xl font-bold text-white">{completionPercentage}%</p>
									<p className="mt-1 text-sm text-slate-400">{progressLabel} curriculum completion</p>
								</div>
								<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-100">
									{completedLessons.length}/{lessonLibrary.length} lessons
								</span>
							</div>

							<div className="mt-4 h-3 rounded-full bg-slate-800">
								<div
									className="h-3 rounded-full bg-gradient-to-r from-gold via-teal-400 to-cyan-400 transition-all duration-300"
									style={{ width: `${completionPercentage}%` }}
								/>
							</div>
						</div>

						<div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
							<p className="text-xs uppercase tracking-[0.28em] text-gold">Profile</p>
							<p className="mt-3 text-lg font-semibold text-white">{user.fullName}</p>
							<p className="mt-1 text-sm text-slate-300">{user.studentProfile?.incubatorName || 'Student incubator member'}</p>
							<p className="mt-3 text-sm text-slate-400">Track your curriculum, mentor meetings, and startup journey in one place.</p>
						</div>

						<button className="ghost-button w-full" type="button" onClick={logout}>
							Logout
						</button>
					</div>
				</aside>

				<section className="space-y-6">
					<header className="glass-panel rounded-[2rem] p-6 sm:p-8">
						<div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
							<div className="max-w-3xl space-y-4">
								<p className="text-sm uppercase tracking-[0.3em] text-slate-400">Learning management system</p>
								<h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
									Build your startup from idea to pitch-ready execution.
								</h2>
								<p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
									The dashboard is structured like an LMS, helping you move through roadmap milestones, curriculum lessons,
									and measurable progress without losing momentum.
								</p>
							</div>

							<div className="grid gap-3 sm:grid-cols-3 xl:w-[32rem]">
								<MetricCard label="Current stage" value="Incubation" />
								<MetricCard label="Completed" value={`${completionPercentage}%`} />
								<MetricCard label="Next step" value={roadmapSteps.find((step) => step.title === 'Pitching') ? 'Pitching' : 'Roadmap'} />
							</div>
						</div>
					</header>

					<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
						<div className="space-y-6">
							<div className="glass-panel rounded-[2rem] p-5 sm:p-6">
								<div className="mb-4 flex items-center justify-between gap-3">
									<div>
										<p className="text-xs uppercase tracking-[0.28em] text-rose-300">Startup Roadmap</p>
										<h3 className="mt-1 text-xl font-semibold text-white">Milestone progression</h3>
									</div>
									<span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
										4-step sequence
									</span>
								</div>

								<div className="grid gap-4 md:grid-cols-2">
									{roadmapSteps.map((step, index) => {
										const isCompleted = index < completedLessons.length;
										const isCurrent = index === Math.min(completedLessons.length, roadmapSteps.length - 1);

										return (
											<article
												key={step.title}
												className={`rounded-[1.5rem] border p-5 transition duration-300 ${
													isCompleted
														? 'border-teal-400/30 bg-teal-400/10'
														: isCurrent
															? 'border-gold/30 bg-gold/10'
															: 'border-white/10 bg-slate-950/55'
												}`}
											>
												<div className="flex items-start justify-between gap-3">
													<div>
														<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Step {index + 1}</p>
														<h4 className="mt-2 text-lg font-semibold text-white">{step.title}</h4>
													</div>
													<span className={`rounded-full px-3 py-1 text-xs font-semibold ${isCompleted ? 'bg-teal-400/15 text-teal-200' : 'bg-white/10 text-slate-200'}`}>
														{isCompleted ? 'Completed' : isCurrent ? 'Current' : 'Upcoming'}
													</span>
												</div>
												<p className="mt-3 text-sm leading-6 text-slate-300">{step.description}</p>
												<p className="mt-4 text-xs uppercase tracking-[0.24em] text-gold">Focus: {step.focus}</p>
											</article>
										);
									})}
								</div>
							</div>

							<div className="glass-panel rounded-[2rem] p-5 sm:p-6">
								<div className="mb-4 flex items-center justify-between gap-3">
									<div>
										<p className="text-xs uppercase tracking-[0.28em] text-teal-300">Lesson Library</p>
										<h3 className="mt-1 text-xl font-semibold text-white">Curriculum cards</h3>
									</div>
									<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
										{lessonLibrary.length} lessons
									</span>
								</div>

								<div className="grid gap-4 md:grid-cols-2">
									{lessonLibrary.map((lesson) => {
										const completed = completedLessons.includes(lesson.id);

										return (
											<article
												key={lesson.id}
												className={`rounded-[1.5rem] border p-5 transition duration-300 hover:-translate-y-1 ${
													completed ? 'border-teal-400/25 bg-teal-400/10' : 'border-white/10 bg-slate-950/55 hover:border-white/20'
												}`}
											>
												<div className="flex items-start justify-between gap-3">
													<div>
														<p className="text-xs uppercase tracking-[0.28em] text-slate-400">{lesson.category}</p>
														<h4 className="mt-2 text-lg font-semibold text-white">{lesson.title}</h4>
													</div>
													<span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">{lesson.duration}</span>
												</div>
												<p className="mt-3 text-sm leading-6 text-slate-300">{lesson.description}</p>

												<div className="mt-5 flex items-center justify-between gap-3">
													<button
														className="primary-button"
														type="button"
														onClick={() => toggleLessonCompletion(lesson.id)}
													>
														{completed ? 'Mark incomplete' : 'Mark complete'}
													</button>
													<span className={`text-sm font-semibold ${completed ? 'text-teal-200' : 'text-slate-400'}`}>
														{completed ? 'Done' : 'In progress'}
													</span>
												</div>
											</article>
										);
									})}
								</div>
							</div>
						</div>

						<aside className="space-y-6">
							<div className="glass-panel rounded-[2rem] p-5 sm:p-6">
								<div className="mb-4">
									<p className="text-xs uppercase tracking-[0.28em] text-gold">Curriculum progress</p>
									<h3 className="mt-1 text-xl font-semibold text-white">Completion tracker</h3>
								</div>

								<div className="space-y-4">
									<div className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
										<div className="flex items-center justify-between gap-3">
											<span className="text-sm text-slate-400">Overall progress</span>
											<span className="text-sm font-semibold text-white">{completionPercentage}%</span>
										</div>
										<div className="mt-3 h-3 rounded-full bg-slate-800">
											<div
												className="h-3 rounded-full bg-gradient-to-r from-gold via-teal-400 to-cyan-400 transition-all duration-300"
												style={{ width: `${completionPercentage}%` }}
											/>
										</div>
									</div>

									<div className="grid gap-3 sm:grid-cols-2">
										<MetricCard label="Lessons done" value={completedLessons.length} />
										<MetricCard label="Lessons left" value={lessonLibrary.length - completedLessons.length} />
									</div>

									<div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
										<p className="text-xs uppercase tracking-[0.28em] text-slate-400">Current focus</p>
										<p className="mt-3 text-sm leading-6 text-slate-200">
											{completionPercentage < 30
												? 'Start with problem validation and customer discovery before spending time building the product.'
												: completionPercentage < 70
													? 'You are moving into execution. Concentrate on MVP quality, feedback loops, and early traction.'
													: 'You are nearing pitch readiness. Refine the narrative, tighten the deck, and prepare for investor conversations.'}
										</p>
									</div>
								</div>
							</div>

							<div className="glass-panel rounded-[2rem] p-5 sm:p-6">
								<p className="text-xs uppercase tracking-[0.28em] text-rose-300">Student profile</p>
								<h3 className="mt-1 text-xl font-semibold text-white">Incubator details</h3>
								<div className="mt-4 space-y-3 text-sm text-slate-300">
									<p><span className="text-slate-400">Name:</span> {user.fullName}</p>
									<p><span className="text-slate-400">Incubator:</span> {user.studentProfile?.incubatorName || 'Not set'}</p>
									<p><span className="text-slate-400">Program:</span> {user.studentProfile?.program || 'Not set'}</p>
									<p><span className="text-slate-400">Graduation:</span> {user.studentProfile?.graduationYear || 'Not set'}</p>
								</div>
							</div>
						</aside>
					</div>

					{/* Live Network & Requests */}
					<NetworkHub title="Student Network & Connection Hub" />

					{/* Recommended Startup Matches via /api/match */}
					<div className="glass-panel rounded-[2rem] p-5 sm:p-6">
						<div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
							<div>
								<p className="text-xs uppercase tracking-[0.28em] text-teal-300">Matching Engine</p>
								<h3 className="mt-1 text-xl font-semibold text-white">Recommended Startup Matches & Mentors</h3>
							</div>
							<span className="rounded-full bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-200">
								Live Match Score
							</span>
						</div>

						{matchesLoading ? (
							<p className="py-8 text-center text-xs text-slate-400">Loading complementary startup matches...</p>
						) : matches.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-xs text-slate-400">
								No new recommendations right now. Expand your skills and interests to discover more startups.
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
													<h4 className="mt-1 text-lg font-semibold text-white">{match.name}</h4>
												</div>
												<span className="rounded-full bg-teal-400/15 px-2.5 py-1 text-xs font-bold text-teal-200">
													{match.matchScore} pts
												</span>
											</div>
											<p className="mt-2 text-xs text-slate-300 line-clamp-2">{match.bio || 'Early stage startup seeking student collaborators.'}</p>
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

					{/* Live Startup Discovery */}
					<div className="glass-panel rounded-[2rem] p-5 sm:p-6">
						<div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-4">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
								<div>
									<p className="text-xs uppercase tracking-[0.28em] text-rose-300">Discovery Engine</p>
									<h3 className="mt-1 text-xl font-semibold text-white">Browse Active Startups & Founders</h3>
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
									placeholder="Search startups by company name, industry, founder, skills..."
									className="input-field text-sm"
								/>
							</div>
						</div>

						{startupsLoading ? (
							<p className="py-8 text-center text-xs text-slate-400">Loading startup directory...</p>
						) : startups.length === 0 ? (
							<div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-xs text-slate-400">
								No startups found. Try adjusting your search keywords.
							</div>
						) : (
							<div className="grid gap-4 md:grid-cols-2">
								{startups.map((startup) => (
									<div
										key={startup.id || startup._id}
										className="flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-950/40 p-5"
									>
										<div>
											<div className="flex items-start justify-between gap-3">
												<div>
													<p className="text-xs uppercase tracking-[0.28em] text-teal-300">{startup.domain}</p>
													<h4 className="mt-1 text-lg font-semibold text-white">{startup.name}</h4>
												</div>
												<span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-200">
													{startup.stage}
												</span>
											</div>
											<p className="mt-2 text-xs text-slate-300 line-clamp-2">{startup.summary}</p>

											{startup.skills && startup.skills.length ? (
												<div className="mt-3 flex flex-wrap gap-1.5">
													{startup.skills.slice(0, 3).map((sk) => (
														<span key={sk} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[0.65rem] text-slate-200">
															{sk}
														</span>
													))}
												</div>
											) : null}
										</div>

										<div className="mt-4 border-t border-white/10 pt-3">
											<ConnectionActions
												targetUserId={startup.id || startup._id}
												initialStatus={startup.connectionStatus || 'none'}
												initialConnectionId={startup.connectionId}
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
					</div>
				</section>
			</div>
		</main>
	);
};

const MetricCard = ({ label, value }) => (
	<div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
		<p className="text-xs uppercase tracking-[0.28em] text-slate-400">{label}</p>
		<p className="mt-2 text-2xl font-bold text-white">{value}</p>
	</div>
);

export default StudentDashboard;
