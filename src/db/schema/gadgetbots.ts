import { pgTable, text, timestamp, real, uuid } from "drizzle-orm/pg-core"

/**
 * GadgetBot table schema
 *
 * Represents robotic helpers that homeowners can rent for various tasks.
 * Inspired by the gadgetbots from Ratchet & Clank.
 */
export const gadgetbots = pgTable("gadgetbots", {
	// Primary key
	id: uuid("id").primaryKey().defaultRandom(),

	// Basic information
	name: text("name").notNull(),
	type: text("type", {
		enum: ["cleaning", "gardening", "security"],
	}).notNull(),
	status: text("status", {
		enum: ["available", "rented", "maintenance", "retired"],
	})
		.notNull()
		.default("available"),
	description: text("description").notNull(),

	// Capabilities
	batteryLife: real("battery_life").notNull(), // in hours
	maxLoadCapacity: real("max_load_capacity").notNull(), // in kg
	features: text("features").array().notNull().default([]),

	// Metadata
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
})

// Export types for use in services
export type GadgetBotRow = typeof gadgetbots.$inferSelect
export type NewGadgetBotRow = typeof gadgetbots.$inferInsert
