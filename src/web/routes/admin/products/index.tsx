import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { orpc } from "@/web/orpc/client"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/web/components/ui/table"
import { Badge } from "@/web/components/ui/badge"
import { Button } from "@/web/components/ui/button"

export const Route = createFileRoute("/admin/products/")({
	component: ProductsPage,
	loader: async ({ context }) => {
		// Prefetch gadgetbots data for SSR
		await context.queryClient.ensureQueryData(
			orpc.gadgetbots.list.queryOptions({ input: {} }),
		)
	},
})

function ProductsPage() {
	const { data: gadgetbots, isLoading } = useQuery(
		orpc.gadgetbots.list.queryOptions({ input: {} }),
	)

	if (isLoading) {
		return (
			<div className="container mx-auto py-8">
				<div className="text-center">Loading...</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold">GadgetBot Products</h1>
					<p className="text-muted-foreground mt-2">
						Manage your rental inventory
					</p>
				</div>
				<Link to="/admin/products/gadgetbots/new">
					<Button>Add New GadgetBot</Button>
				</Link>
			</div>

			<div className="border rounded-lg">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Battery Life</TableHead>
							<TableHead>Load Capacity</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{gadgetbots?.map((bot) => (
							<TableRow key={bot.id}>
								<TableCell className="font-medium">{bot.name}</TableCell>
								<TableCell>
									<Badge variant="outline" className="capitalize">
										{bot.type}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge
										variant={
											bot.status === "available"
												? "default"
												: bot.status === "maintenance"
													? "secondary"
													: "destructive"
										}
									>
										{bot.status}
									</Badge>
								</TableCell>
								<TableCell>{bot.batteryLife}hrs</TableCell>
								<TableCell>{bot.maxLoadCapacity}kg</TableCell>
								<TableCell className="text-right space-x-2">
									<Link to="/admin/products/gadgetbots/$id" params={{ id: bot.id }}>
										<Button variant="outline" size="sm">
											View
										</Button>
									</Link>
									<Link
										to="/admin/products/gadgetbots/$id/edit"
										params={{ id: bot.id }}
									>
										<Button variant="outline" size="sm">
											Edit
										</Button>
									</Link>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{gadgetbots?.length === 0 && (
				<div className="text-center py-12">
					<p className="text-muted-foreground mb-4">
						No gadgetbots found. Create your first one to get started.
					</p>
					<Link to="/admin/products/gadgetbots/new">
						<Button>Add New GadgetBot</Button>
					</Link>
				</div>
			)}
		</div>
	)
}
