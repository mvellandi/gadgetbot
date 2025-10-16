import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/web/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/web/components/ui/card"

export const Route = createFileRoute("/admin/")({
	component: AdminDashboard,
})

function AdminDashboard() {
	return (
		<div className="container mx-auto py-8">
			<div className="mb-8">
				<h1 className="text-4xl font-bold">Admin Dashboard</h1>
				<p className="text-muted-foreground mt-2">
					Manage your GadgetBot rental service
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle>Products</CardTitle>
						<CardDescription>
							Manage your GadgetBot inventory
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
							View, add, edit, and manage all GadgetBot products in your rental
							inventory.
						</p>
						<Link to="/admin/products">
							<Button className="w-full">Manage Products</Button>
						</Link>
					</CardContent>
				</Card>

				{/* Placeholder cards for future admin features */}
				<Card className="opacity-60">
					<CardHeader>
						<CardTitle>Rentals</CardTitle>
						<CardDescription>Track active rentals</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
							View and manage customer rentals, returns, and rental history.
						</p>
						<Button className="w-full" disabled>
							Coming Soon
						</Button>
					</CardContent>
				</Card>

				<Card className="opacity-60">
					<CardHeader>
						<CardTitle>Customers</CardTitle>
						<CardDescription>Manage customer accounts</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
							View customer information, rental history, and account details.
						</p>
						<Button className="w-full" disabled>
							Coming Soon
						</Button>
					</CardContent>
				</Card>

				<Card className="opacity-60">
					<CardHeader>
						<CardTitle>Analytics</CardTitle>
						<CardDescription>Business insights</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
							View revenue, popular products, and rental trends.
						</p>
						<Button className="w-full" disabled>
							Coming Soon
						</Button>
					</CardContent>
				</Card>

				<Card className="opacity-60">
					<CardHeader>
						<CardTitle>Maintenance</CardTitle>
						<CardDescription>Service schedules</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
							Track maintenance schedules and service history for all bots.
						</p>
						<Button className="w-full" disabled>
							Coming Soon
						</Button>
					</CardContent>
				</Card>

				<Card className="opacity-60">
					<CardHeader>
						<CardTitle>Settings</CardTitle>
						<CardDescription>System configuration</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
							Configure system settings, pricing, and business rules.
						</p>
						<Button className="w-full" disabled>
							Coming Soon
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
