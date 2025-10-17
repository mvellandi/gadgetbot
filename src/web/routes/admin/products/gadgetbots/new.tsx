import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { client } from "@/web/orpc/client"
import { useForm } from "@tanstack/react-form"
import { BOT_SPECS } from "@/domains/products/gadgetbot-specs"
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/web/components/ui/select"
import { useState } from "react"

export const Route = createFileRoute("/admin/products/gadgetbots/new")({
	component: NewGadgetBotPage,
})

type BotType = "cleaning" | "gardening" | "security" | undefined

function NewGadgetBotPage() {
	const navigate = useNavigate()
	const createMutation = useMutation({
		mutationFn: async (input: { name: string; type: "cleaning" | "gardening" | "security" }) => {
			return await client.gadgetbots.create(input)
		},
	})
	const [selectedType, setSelectedType] = useState<BotType>(undefined)

	// Get bot specs for displaying type information
	const specs = BOT_SPECS

	const form = useForm({
		defaultValues: {
			name: "",
			type: undefined as BotType,
		},
		onSubmit: async ({ value }) => {
			try {
				// Validate that type is selected
				if (!value.type) {
					alert("Please select a bot type")
					return
				}

				await createMutation.mutateAsync({
					name: value.name,
					type: value.type,
				})

				// Navigate to products list on success
				navigate({ to: "/admin/products" })
			} catch (error) {
				console.error("Failed to create gadgetbot:", error)
				alert(
					error instanceof Error ? error.message : "Failed to create gadgetbot",
				)
			}
		},
	})

	return (
		<div className="container mx-auto py-8 max-w-3xl">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Create New GadgetBot</h1>
				<p className="text-muted-foreground mt-2">
					Add a new bot to your rental inventory
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
						<CardTitle>Bot Details</CardTitle>
						<CardDescription>
							Choose a bot type and give it a unique name. Specifications are
							automatically set based on the type.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Name Field */}
						<form.Field name="name">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="name">
										Name <span className="text-destructive">*</span>
									</Label>
									<Input
										id="name"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="e.g., CleanBot Alpha-1"
										required
									/>
									<p className="text-sm text-muted-foreground">
										Give your bot a unique identifier
									</p>
								</div>
							)}
						</form.Field>

						{/* Type Field */}
						<form.Field name="type">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="type">
										Bot Type <span className="text-destructive">*</span>
									</Label>
									<Select
										value={field.state.value}
										onValueChange={(value) => {
											const type = value as BotType
											field.handleChange(type)
											setSelectedType(type)
										}}
									>
										<SelectTrigger id="type">
											<SelectValue placeholder="Select a bot type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="cleaning">Cleaning Bot</SelectItem>
											<SelectItem value="gardening">Gardening Bot</SelectItem>
											<SelectItem value="security">Security Bot</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-sm text-muted-foreground">
										Each type has different capabilities and features
									</p>
								</div>
							)}
						</form.Field>

						{/* Bot Type Preview */}
						{selectedType && (
							<Card className="bg-muted">
								<CardHeader>
									<CardTitle className="text-lg capitalize">
										{selectedType} Bot Specifications
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<p className="text-sm font-medium">Description</p>
										<p className="text-sm text-muted-foreground">
											{specs[selectedType].description}
										</p>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-sm font-medium">Battery Life</p>
											<p className="text-sm text-muted-foreground">
												{specs[selectedType].batteryLife} hours
											</p>
										</div>
										<div>
											<p className="text-sm font-medium">Max Load Capacity</p>
											<p className="text-sm text-muted-foreground">
												{specs[selectedType].maxLoadCapacity} kg
											</p>
										</div>
									</div>

									<div>
										<p className="text-sm font-medium mb-2">Features</p>
										<ul className="text-sm text-muted-foreground space-y-1">
											{specs[selectedType].features.map((feature, idx) => (
												<li key={idx}>• {feature}</li>
											))}
										</ul>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Actions */}
						<div className="flex gap-4 pt-4">
							<Button
								type="submit"
								disabled={createMutation.isPending}
								className="flex-1"
							>
								{createMutation.isPending ? "Creating..." : "Create GadgetBot"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => navigate({ to: "/admin/products" })}
								disabled={createMutation.isPending}
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
