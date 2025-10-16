import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { authClient } from "@/web/auth/client"
import { Button } from "@/web/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/web/components/ui/card"
import { useState } from "react"

export const Route = createFileRoute("/login")({
	component: LoginPage,
})

function LoginPage() {
	const navigate = useNavigate()
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleZitadelSignIn = async () => {
		try {
			setIsLoading(true)
			setError(null)

			await authClient.signIn.social({
				provider: "zitadel",
				callbackURL: "/admin/products",
			})

			// Redirect will happen automatically via OAuth flow
		} catch (err) {
			console.error("Sign in error:", err)
			setError(
				err instanceof Error ? err.message : "Failed to sign in. Please try again.",
			)
			setIsLoading(false)
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold">Sign In</CardTitle>
					<CardDescription>
						Sign in to access the GadgetBot admin dashboard
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{error && (
						<div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
							{error}
						</div>
					)}

					<Button
						onClick={handleZitadelSignIn}
						disabled={isLoading}
						className="w-full"
						size="lg"
					>
						{isLoading ? "Signing in..." : "Sign in with Zitadel"}
					</Button>

					<p className="text-center text-xs text-gray-500">
						By signing in, you agree to our terms of service and privacy policy.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
