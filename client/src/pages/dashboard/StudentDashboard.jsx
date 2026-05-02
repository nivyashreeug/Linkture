import { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

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

	const completionPercentage = useMemo(() => {
		return Math.round((completedLessons.length / lessonLibrary.length) * 100);
	}, [completedLessons]);

	const progressLabel = completionPercentage >= 75 ? 'Advanced' : completionPercentage >= 40 ? 'In progress' : 'Getting started';

	const toggleLessonCompletion = (lessonId) => {
		setCompletedLessons((current) =>
			current.includes(lessonId) ? current.filter((id) => id !== lessonId) : [...current, lessonId]
		);
	};

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
								Follow your startup curriculum, track progress, and move through each milestone with clarity.
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
