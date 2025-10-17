import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/web/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/web/components/ui/card"

export const Route = createFileRoute("/401")({
	component: UnauthorizedPage,
})

/**
 * 401 Unauthorized Page
 *
 * Displayed when a user tries to access a protected resource without authentication.
 * Provides clear messaging and a sign-in button.
 */
function UnauthorizedPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center space-y-2">
					<div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
						<svg
							className="w-8 h-8 text-red-600"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
					<CardTitle className="text-2xl font-bold">
						Authentication Required
					</CardTitle>
					<CardDescription>
						You need to sign in to access this page.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Link to="/login">
						<Button className="w-full" size="lg">
							Sign In
						</Button>
					</Link>
					<div className="text-center">
						<Link
							to="/"
							className="text-sm text-gray-600 hover:text-gray-900 underline"
						>
							Return to Home
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
