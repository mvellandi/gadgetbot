import { Outlet, createFileRoute, redirect } from "@tanstack/react-router"
import { createIsomorphicFn } from "@tanstack/react-start"
import { useSession } from "@/web/auth/client"
import { UserMenu } from "@/web/components/UserMenu"

/**
 * Server-only function to get session
 * Wrapped in createIsomorphicFn to prevent server imports in client bundle
 */
const getServerSession = createIsomorphicFn().server(async () => {
	const { getRequestHeaders } = await import("@tanstack/react-start/server")
	const { auth } = await import("@/auth/server")

	const headers = getRequestHeaders()
	const session = await auth.api.getSession({ headers })
	return session
})

/**
 * Admin Layout Route
 *
 * Protected route that requires authentication.
 * All routes under /admin/* inherit this authentication requirement.
 *
 * Features:
 * - Server-side authentication check (beforeLoad)
 * - Redirects to /login if not authenticated
 * - Shows UserMenu in header
 */
export const Route = createFileRoute("/admin")({
	beforeLoad: async ({ location }) => {
		// Only run on server-side
		if (typeof window === "undefined") {
			const session = await getServerSession()

			if (!session?.user) {
				throw redirect({
					to: "/login",
					search: {
						redirect: location.pathname,
					},
				})
			}
		}
	},
	component: AdminLayout,
})

function AdminLayout() {
	const { data: session } = useSession()

	// If no session on client, redirect will happen on next navigation
	// This prevents flash during SSR hydration
	if (!session?.user) {
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
