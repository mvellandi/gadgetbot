import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation } from "@tanstack/react-query"
import { orpc, client } from "@/web/orpc/client"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/web/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/web/components/ui/card"
import { Input } from "@/web/components/ui/input"
import { Label } from "@/web/components/ui/label"

export const Route = createFileRoute("/admin/products/gadgetbots/$id/edit")({
	component: EditGadgetBotPage,
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			orpc.gadgetbots.getById.queryOptions({ input: { id: params.id } }),
		)
	},
})

function EditGadgetBotPage() {
	const { id } = Route.useParams()
	const navigate = useNavigate()

	const { data: bot, isLoading } = useQuery(
		orpc.gadgetbots.getById.queryOptions({ input: { id } }),
	)
	const updateMutation = useMutation({
		mutationFn: async (data: { id: string; data: { batteryLife?: number } }) => {
			return await client.gadgetbots.update(data)
		},
	})

	const form = useForm({
		defaultValues: {
			batteryLife: bot?.batteryLife ?? 0,
		},
		onSubmit: async ({ value }) => {
			try {
				await updateMutation.mutateAsync({
					id,
					data: {
						batteryLife: value.batteryLife,
					},
				})

				// Navigate to detail view on success
				navigate({ to: "/admin/products/gadgetbots/$id", params: { id } })
			} catch (error) {
				console.error("Failed to update gadgetbot:", error)
				alert(
					error instanceof Error ? error.message : "Failed to update gadgetbot",
				)
			}
		},
	})

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
						<Button onClick={() => navigate({ to: "/admin/products" })}>
							Back to Products
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	// Update form default values when bot loads
	if (bot && form.state.values.batteryLife === 0) {
		form.setFieldValue("batteryLife", bot.batteryLife)
	}

	return (
		<div className="container mx-auto py-8 max-w-3xl">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Edit {bot.name}</h1>
				<p className="text-muted-foreground mt-2">
					Update the bot's current battery life
				</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					form.handleSubmit()
				}}
			>
				<Card>
					<CardHeader>
						<CardTitle>Bot Specifications</CardTitle>
						<CardDescription>
							Most specifications are fixed based on bot type. You can only
							update the battery life to reflect the unit's current condition.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Read-only fields */}
						<div className="space-y-4 p-4 bg-muted rounded-lg">
							<h3 className="font-medium">Fixed Specifications</h3>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Name
									</p>
									<p className="mt-1">{bot.name}</p>
								</div>
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Type
									</p>
									<p className="mt-1 capitalize">{bot.type}</p>
								</div>
							</div>

							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Max Load Capacity
								</p>
								<p className="mt-1">{bot.maxLoadCapacity} kg</p>
							</div>

							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Features
								</p>
								<ul className="mt-1 space-y-1">
									{bot.features.map((feature: string, idx: number) => (
										<li key={idx} className="text-sm">
											• {feature}
										</li>
									))}
								</ul>
							</div>
						</div>

						{/* Editable fields */}
						<div className="space-y-4">
							<h3 className="font-medium">Editable Fields</h3>

							<form.Field name="batteryLife">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor="batteryLife">
											Battery Life (hours){" "}
											<span className="text-destructive">*</span>
										</Label>
										<Input
											id="batteryLife"
											type="number"
											min="1"
											step="0.5"
											value={field.state.value}
											onChange={(e) =>
												field.handleChange(Number.parseFloat(e.target.value))
											}
											required
										/>
										<p className="text-sm text-muted-foreground">
											Update to reflect the unit's current battery capacity
										</p>
									</div>
								)}
							</form.Field>
						</div>

						{/* Actions */}
						<div className="flex gap-4 pt-4">
							<Button
								type="submit"
								disabled={updateMutation.isPending}
								className="flex-1"
							>
								{updateMutation.isPending ? "Updating..." : "Update GadgetBot"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() =>
									navigate({ to: "/admin/products/gadgetbots/$id", params: { id } })
								}
								disabled={updateMutation.isPending}
							>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			</form>
		</div>
	)
}
