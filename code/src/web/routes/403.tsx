import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { Button } from "@/web/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/web/components/ui/card"

export const Route = createFileRoute("/403")({
	component: ForbiddenPage,
})

/**
 * 403 Forbidden Page
 *
 * Displayed when an authenticated user tries to access a resource they don't have permission for.
 * Provides clear messaging and navigation options.
 */
function ForbiddenPage() {
	const router = useRouter()

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center space-y-2">
					<div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
						<svg
							className="w-8 h-8 text-orange-600"
							fill="none"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
						</svg>
					</div>
					<CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
					<CardDescription>
						You don't have permission to access this resource.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-gray-600 text-center">
						If you believe this is an error, please contact your administrator.
					</p>
					<Button
						onClick={() => router.history.back()}
						variant="outline"
						className="w-full"
						size="lg"
					>
						Go Back
					</Button>
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
