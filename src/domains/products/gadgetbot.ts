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

// CREATE
// Input schemas derived from main schema (like Ecto changesets)
// For creating: omit server-generated fields
export const CreateGadgetBotInput = S.Struct(GadgetBot.fields).pipe(
	S.omit("id", "status", "createdAt", "updatedAt"),
)

export type CreateGadgetBotInput = typeof CreateGadgetBotInput.Type

// UPDATE
// For updating: require id, make user-editable fields optional
const updateableFields = S.Struct(GadgetBot.fields).pipe(
	S.omit("id", "createdAt", "updatedAt"),
)

export const UpdateGadgetBotInput = S.Struct({
	id: S.String,
}).pipe(S.extend(S.partial(updateableFields)))

export type UpdateGadgetBotInput = typeof UpdateGadgetBotInput.Type
