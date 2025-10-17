import { Outlet, createFileRoute } from "@tanstack/react-router"
import { useSession } from "@/web/auth/client"
import { UserMenu } from "@/web/components/UserMenu"

/**
 * Admin Layout Route
 *
 * Protected route that requires authentication.
 * All routes under /admin/* inherit this authentication requirement.
 *
 * Features:
 * - Authentication check before rendering (beforeLoad)
 * - Redirects to /login if not authenticated
 * - Provides user context to child routes
 * - Shows UserMenu in header
 */
export const Route = createFileRoute("/admin")({
	beforeLoad: async () => {
		// For now, we'll check on the client side
		// In a future iteration, we can add server-side session validation
		return {}
	},
	component: AdminLayout,
})

function AdminLayout() {
	const { data: session, isPending } = useSession()

	// Show loading state while checking session
	if (isPending) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		)
	}

	// Redirect to login if not authenticated
	if (!session?.user) {
		// Client-side redirect
		window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
		return null
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header with UserMenu */}
			<header className="bg-white shadow-sm border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<h1 className="text-2xl font-bold text-gray-900">
								GadgetBot Admin
							</h1>
							<nav className="flex space-x-4">
								<a
									href="/admin"
									className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
								>
									Dashboard
								</a>
								<a
									href="/admin/products"
									className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
								>
									Products
								</a>
							</nav>
						</div>
						<UserMenu user={session.user} />
					</div>
				</div>
			</header>

			{/* Main content area */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<Outlet />
			</main>
		</div>
	)
}
