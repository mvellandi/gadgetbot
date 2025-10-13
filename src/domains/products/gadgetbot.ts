import { Schema as S } from "effect"

/**
 * GadgetBot Resource
 *
 * Represents a robotic helper that homeowners can rent for various tasks.
 * Inspired by the gadgetbots from Ratchet & Clank.
 */

// Enums for GadgetBot properties
export const GadgetBotType = S.Literal("cleaning", "gardening", "security")

export const GadgetBotStatus = S.Literal(
	"available",
	"rented",
	"maintenance",
	"retired",
)

// Main GadgetBot S
export const GadgetBot = S.Struct({
	id: S.String,
	name: S.String,
	type: GadgetBotType,
	status: GadgetBotStatus,
	description: S.String,

	// Capabilities
	batteryLife: S.Number.pipe(
		S.greaterThan(0),
		S.annotations({ description: "Battery life in hours" }),
	),
	maxLoadCapacity: S.Number.pipe(
		S.greaterThan(0),
		S.annotations({ description: "Maximum load capacity in kg" }),
	),
	features: S.Array(S.String),

	// Metadata
	imageUrl: S.optional(S.String),
	createdAt: S.DateTimeUtc,
	updatedAt: S.DateTimeUtc,
})

// Type inference
export type GadgetBot = typeof GadgetBot.Type

// Input S for creating a new GadgetBot (without generated fields)
export const CreateGadgetBotInput = S.Struct({
	name: S.String,
	type: GadgetBotType,
	description: S.String,
	batteryLife: S.Number.pipe(S.greaterThan(0)),
	maxLoadCapacity: S.Number.pipe(S.greaterThan(0)),
	features: S.Array(S.String),
	imageUrl: S.optional(S.String),
})

export type CreateGadgetBotInput = typeof CreateGadgetBotInput.Type

// Input S for updating a GadgetBot (all fields optional except id)
export const UpdateGadgetBotInput = S.Struct({
	id: S.String,
	name: S.optional(S.String),
	status: S.optional(GadgetBotStatus),
	description: S.optional(S.String),
	batteryLife: S.optional(S.Number.pipe(S.greaterThan(0))),
	maxLoadCapacity: S.optional(S.Number.pipe(S.greaterThan(0))),
	features: S.optional(S.Array(S.String)),
	imageUrl: S.optional(S.String),
})

export type UpdateGadgetBotInput = typeof UpdateGadgetBotInput.Type
