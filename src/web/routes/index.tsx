import { createFileRoute, Link } from '@tanstack/react-router'
import { Bot, LogIn } from 'lucide-react'
import { BOT_SPECS } from '@/domains/products/gadgetbot-specs'

export const Route = createFileRoute('/')({
	component: HomePage,
})

function HomePage() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
			{/* Admin Auth Section */}
			<div className="fixed top-4 right-4 z-50">
				<Link
					to="/login"
					search={{ redirect: "/admin" }}
					className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur-sm border border-slate-700 hover:border-cyan-500/50 rounded-lg text-gray-300 hover:text-cyan-400 transition-all duration-300 shadow-lg"
				>
					<LogIn className="w-4 h-4" />
					<span className="text-sm font-medium">Admin Login</span>
				</Link>
			</div>

			{/* Hero Section */}
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
					<p className="text-lg text-gray-400 max-w-3xl mx-auto text-balance">
						Advanced TanStack robotics with Effect-powered type safety, ShadCN components, and Zitadel security.
					</p>
				</div>
			</section>

			{/* Gadgetbot Cards Section */}
			<section className="py-16 px-6">
				<div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
					<GadgetBotCard
						type="Cleaning Bot"
						description={BOT_SPECS.cleaning.description}
						features={BOT_SPECS.cleaning.features}
						imageUrl={BOT_SPECS.cleaning.imageUrl}
					/>
					<GadgetBotCard
						type="Gardening Bot"
						description={BOT_SPECS.gardening.description}
						features={BOT_SPECS.gardening.features}
						imageUrl={BOT_SPECS.gardening.imageUrl}
					/>
					<GadgetBotCard
						type="Security Bot"
						description={BOT_SPECS.security.description}
						features={BOT_SPECS.security.features}
						imageUrl={BOT_SPECS.security.imageUrl}
					/>
				</div>
			</section>
		</div>
	)
}

function GadgetBotCard({
	type,
	description,
	features,
	imageUrl,
}: {
	type: string
	description: string
	features: readonly string[]
	imageUrl: string | null
}) {
	return (
		<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 flex flex-col">
			{/* GadgetBot Image */}
			<div className="aspect-square w-full overflow-hidden border-b border-slate-700 bg-slate-900">
				{imageUrl ? (
					<img
						src={imageUrl}
						alt={type}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
						<Bot className="w-24 h-24 text-slate-600" />
					</div>
				)}
			</div>

			{/* Content */}
			<div className="p-6 flex flex-col flex-1">
				<h3 className="text-2xl font-bold text-white mb-3">{type}</h3>
				<p className="text-gray-400 leading-relaxed mb-6">{description}</p>

				{/* Features List */}
				<div className="mb-6 flex-1">
					<h4 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wide">
						Key Features
					</h4>
					<ul className="space-y-2">
						{features.map((feature, index) => (
							<li key={index} className="text-sm text-gray-300 flex items-start gap-2">
								<span className="text-cyan-400 mt-1">•</span>
								<span>{feature}</span>
							</li>
						))}
					</ul>
				</div>

				{/* Coming Soon Button */}
				<button
					type="button"
					disabled
					className="w-full px-6 py-3 bg-slate-700 text-gray-400 font-semibold rounded-lg cursor-not-allowed"
				>
					Coming Soon
				</button>
			</div>
		</div>
	)
}
