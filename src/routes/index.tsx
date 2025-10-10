import { createFileRoute } from '@tanstack/react-router'
import { Bot, Sparkles, Shield, Clock } from 'lucide-react'

export const Route = createFileRoute('/')({
	component: HomePage,
})

function HomePage() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			<section className="relative py-20 px-6 text-center overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
				<div className="relative max-w-5xl mx-auto">
					<div className="flex items-center justify-center gap-6 mb-6">
						<Bot className="w-24 h-24 md:w-32 md:h-32 text-cyan-400" />
						<h1 className="text-6xl md:text-7xl font-bold text-white">
							<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
								GadgetBot
							</span>
							<span className="text-gray-300"> Rentals</span>
						</h1>
					</div>
					<p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
						Your trusted companion bot rental service
					</p>
					<p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
						From cleaning to security, rent the perfect GadgetBot for any task.
						Advanced robotics with Effect-powered type safety and reliability.
					</p>
				</div>
			</section>

			<section className="py-16 px-6 max-w-7xl mx-auto">
				<h2 className="text-3xl font-bold text-white mb-8 text-center">
					Why Choose GadgetBot?
				</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<FeatureCard
						icon={<Bot className="w-12 h-12 text-cyan-400" />}
						title="Specialized Bots"
						description="Choose from cleaning, gardening, security, and more specialized GadgetBots"
					/>
					<FeatureCard
						icon={<Sparkles className="w-12 h-12 text-cyan-400" />}
						title="Advanced Capabilities"
						description="Each bot comes with unique capabilities and metadata tracking"
					/>
					<FeatureCard
						icon={<Shield className="w-12 h-12 text-cyan-400" />}
						title="Type-Safe API"
						description="Built with Effect Schema and oRPC for runtime validation and type safety"
					/>
					<FeatureCard
						icon={<Clock className="w-12 h-12 text-cyan-400" />}
						title="Real-Time Status"
						description="Track your GadgetBot's status in real-time with SSR support"
					/>
				</div>
			</section>

			<section className="py-16 px-6 max-w-5xl mx-auto text-center">
				<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
					<h2 className="text-2xl font-bold text-white mb-4">
						Ready to Rent a GadgetBot?
					</h2>
					<p className="text-gray-400 mb-6">
						Browse our catalog of specialized companion bots and find the perfect
						match for your needs.
					</p>
					<button
						type="button"
						className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-cyan-500/50"
					>
						Browse GadgetBots
					</button>
				</div>
			</section>
		</div>
	)
}

function FeatureCard({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode
	title: string
	description: string
}) {
	return (
		<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
			<div className="mb-4">{icon}</div>
			<h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
			<p className="text-gray-400 leading-relaxed">{description}</p>
		</div>
	)
}
