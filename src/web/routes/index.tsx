import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot, LogIn } from "lucide-react";
import { BOT_SPECS } from "@/domains/products/gadgetbot-specs";

export const Route = createFileRoute("/")({
	component: HomePage,
});

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
			<section className="relative pt-20 pb-6 md:pb-12 px-6 text-center overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10"></div>
				<div className="relative max-w-5xl mx-auto">
					<div className="flex items-center justify-center gap-6 mb-4 md:-mb-3">
						<Bot className="w-24 h-24 md:w-32 md:h-32 text-cyan-400 hidden md:inline-block" />
						<h1 className="text-5xl md:text-7xl font-bold text-white">
							<span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
								GadgetBot
							</span>
							<span className="text-gray-300"> Rentals</span>
						</h1>
					</div>
					<p className="text-xl md:text-2xl md:pl-24 text-gray-400 max-w-3xl mx-auto text-balance">
						A demo app for securely managing product inventory.
					</p>
				</div>
			</section>

			<div className="py-8 flex flex-col md:flex-row gap-8 md:gap-24 max-w-4xl mx-auto px-6 md:px-0 justify-between md:pb-2">
				{/* Get Started */}
				<section className="flex-1">
					<h2 className="text-3xl font-medium mb-2 text-cyan-400 max-w-4xl mx-auto tracking-tight">
						Get Started
					</h2>
					<p className="text-lg text-gray-100 pb-6">
						Create and manage bots by{" "}
						<Link
							to="/login"
							search={{ redirect: "/admin" }}
							className="text-cyan-400"
						>
							signing in
						</Link>{" "}
						with username: "demo", pass: "Demo777-"
					</p>
					<p className="text-lg text-gray-100">
						See the{" "}
						<a
							href="https://github.com/mvellandi/gadgetbot"
							target="_blank"
							rel="noopener noreferrer"
							className="text-cyan-400"
						>
							GitHub repo
						</a>
					</p>
				</section>

				{/* Features */}
				<section className="flex-1">
					<h2 className="text-3xl font-medium mb-2 text-cyan-400 max-w-4xl mx-auto tracking-tight">
						Tech Stack
					</h2>
					<ul className="text-lg text-gray-400 max-w-4xl [&_b]:text-gray-100 [&_b]:font-normal flex flex-col gap-1 md:gap-1">
						<li>
							<b>Framework</b>: TanStack Start, TypeScript
						</li>
						<li>
							<b>Backend</b>: Effect, ORPC, TanStack Query
						</li>
						<li>
							<b>Frontend</b>: Tailwind, ShadCN
						</li>
						<li>
							<b>Data</b>: Postgres, Drizzle
						</li>
						<li>
							<b>Authentication</b>: Zitadel, BetterAuth
						</li>
						<li>
							<b>Fully hosted</b> on Hetzner using Coolify
						</li>
					</ul>
				</section>
			</div>

			{/* Gadgetbot Cards Section */}
			<section className="pb-16 px-6">
				<h2 className="text-3xl font-medium mb-4 text-cyan-400 max-w-4xl mx-auto tracking-tight">
					Product Bots
				</h2>
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
	);
}

function GadgetBotCard({
	type,
	description,
	features,
	imageUrl,
}: {
	type: string;
	description: string;
	features: readonly string[];
	imageUrl: string | null;
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
							<li
								key={index}
								className="text-sm text-gray-300 flex items-start gap-2"
							>
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
	);
}
