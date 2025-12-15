import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation } from "@tanstack/react-query"
import { orpc, client } from "@/web/orpc/client"
import { Button } from "@/web/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/web/components/ui/card"
import { Badge } from "@/web/components/ui/badge"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/web/components/ui/dialog"
import { useState } from "react"

export const Route = createFileRoute("/admin/products/gadgetbots/$id/")({
	component: GadgetBotDetailPage,
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			orpc.gadgetbots.getById.queryOptions({ input: { id: params.id } }),
		)
	},
})

function GadgetBotDetailPage() {
	const { id } = Route.useParams()
	const navigate = useNavigate()
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

	const { data: bot, isLoading } = useQuery(
		orpc.gadgetbots.getById.queryOptions({ input: { id } }),
	)
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return await client.gadgetbots.deleteById({ id })
		},
	})

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(id)
			navigate({ to: "/admin/products" })
		} catch (error) {
			console.error("Failed to delete gadgetbot:", error)
			alert(
				error instanceof Error ? error.message : "Failed to delete gadgetbot",
			)
		}
	}

	if (isLoading) {
		return (
			<div className="container mx-auto py-8">
				<div className="text-center">Loading...</div>
			</div>
		)
	}

	if (!bot) {
		return (
			<div className="container mx-auto py-8">
				<Card>
					<CardHeader>
						<CardTitle>GadgetBot Not Found</CardTitle>
						<CardDescription>
							The requested gadgetbot could not be found.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link to="/admin/products">
							<Button>Back to Products</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="container mx-auto py-8 max-w-4xl">
			{/* Header */}
			<div className="flex justify-between items-start mb-6">
				<div>
					<h1 className="text-3xl font-bold">{bot.name}</h1>
					<p className="text-muted-foreground mt-2">GadgetBot Details</p>
				</div>
				<div className="flex gap-2">
					<Link to="/admin/products/gadgetbots/$id/edit" params={{ id }}>
						<Button variant="outline">Edit</Button>
					</Link>
					<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
						<DialogTrigger asChild>
							<Button variant="destructive">Delete</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Confirm Deletion</DialogTitle>
								<DialogDescription>
									Are you sure you want to delete "{bot.name}"? This action
									cannot be undone.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setDeleteDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button
									variant="destructive"
									onClick={handleDelete}
									disabled={deleteMutation.isPending}
								>
									{deleteMutation.isPending ? "Deleting..." : "Delete"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<div className="grid gap-6">
				{/* Basic Information */}
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Type
								</p>
								<Badge variant="outline" className="capitalize mt-1">
									{bot.type}
								</Badge>
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Status
								</p>
								<Badge
									variant={
										bot.status === "available"
											? "default"
											: bot.status === "maintenance"
												? "secondary"
												: "destructive"
									}
									className="capitalize mt-1"
								>
									{bot.status}
								</Badge>
							</div>
						</div>

						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Description
							</p>
							<p className="mt-1">{bot.description}</p>
						</div>
					</CardContent>
				</Card>

				{/* Specifications */}
				<Card>
					<CardHeader>
						<CardTitle>Specifications</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Battery Life
								</p>
								<p className="text-2xl font-bold mt-1">
									{bot.batteryLife}
									<span className="text-sm font-normal text-muted-foreground ml-1">
										hours
									</span>
								</p>
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Max Load Capacity
								</p>
								<p className="text-2xl font-bold mt-1">
									{bot.maxLoadCapacity}
									<span className="text-sm font-normal text-muted-foreground ml-1">
										kg
									</span>
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Features */}
				<Card>
					<CardHeader>
						<CardTitle>Features</CardTitle>
					</CardHeader>
					<CardContent>
						<ul className="space-y-2">
							{bot.features.map((feature: string, idx: number) => (
								<li key={idx} className="flex items-start">
									<span className="text-primary mr-2">•</span>
									<span>{feature}</span>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>

				{/* Metadata */}
				<Card>
					<CardHeader>
						<CardTitle>Metadata</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Created At
								</p>
								<p className="mt-1">
									{new Date(bot.createdAt as unknown as string).toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Updated At
								</p>
								<p className="mt-1">
									{new Date(bot.updatedAt as unknown as string).toLocaleString()}
								</p>
							</div>
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">ID</p>
							<p className="mt-1 font-mono text-sm">{bot.id}</p>
						</div>
					</CardContent>
				</Card>

				{/* Back Button */}
				<Link to="/admin/products">
					<Button variant="outline" className="w-full">
						Back to Products
					</Button>
				</Link>
			</div>
		</div>
	)
}
