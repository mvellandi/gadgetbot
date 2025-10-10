import { Schema } from "effect"

/**
 * GadgetBot Resource
 *
 * Represents a robotic helper that homeowners can rent for various tasks.
 * Inspired by the gadgetbots from Ratchet & Clank.
 */

// Enums for GadgetBot properties
export const GadgetBotType = Schema.Literal("cleaning", "gardening", "security")

export const GadgetBotStatus = Schema.Literal(
	"available",
	"rented",
	"maintenance",
	"retired",
)

// Main GadgetBot schema
export const GadgetBot = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	type: GadgetBotType,
	status: GadgetBotStatus,
	description: Schema.String,

	// Capabilities
	batteryLife: Schema.Number.pipe(
		Schema.greaterThan(0),
		Schema.annotations({ description: "Battery life in hours" }),
	),
	maxLoadCapacity: Schema.Number.pipe(
		Schema.greaterThan(0),
		Schema.annotations({ description: "Maximum load capacity in kg" }),
	),
	features: Schema.Array(Schema.String),

	// Metadata
	imageUrl: Schema.optional(Schema.String),
	createdAt: Schema.DateTimeUtc,
	updatedAt: Schema.DateTimeUtc,
})

// Type inference
export type GadgetBot = typeof GadgetBot.Type

// Input schema for creating a new GadgetBot (without generated fields)
export const CreateGadgetBotInput = Schema.Struct({
	name: Schema.String,
	type: GadgetBotType,
	description: Schema.String,
	batteryLife: Schema.Number.pipe(Schema.greaterThan(0)),
	maxLoadCapacity: Schema.Number.pipe(Schema.greaterThan(0)),
	features: Schema.Array(Schema.String),
	imageUrl: Schema.optional(Schema.String),
})

export type CreateGadgetBotInput = typeof CreateGadgetBotInput.Type

// Input schema for updating a GadgetBot (all fields optional except id)
export const UpdateGadgetBotInput = Schema.Struct({
	id: Schema.String,
	name: Schema.optional(Schema.String),
	status: Schema.optional(GadgetBotStatus),
	description: Schema.optional(Schema.String),
	batteryLife: Schema.optional(Schema.Number.pipe(Schema.greaterThan(0))),
	maxLoadCapacity: Schema.optional(Schema.Number.pipe(Schema.greaterThan(0))),
	features: Schema.optional(Schema.Array(Schema.String)),
	imageUrl: Schema.optional(Schema.String),
})

export type UpdateGadgetBotInput = typeof UpdateGadgetBotInput.Type
