/**
 * Products oRPC Router
 *
 * Type-safe RPC endpoints for GadgetBot product management.
 * Used by web client, CLI, and external API consumers.
 *
 * Only interacts with the Products domain API - maintains clean boundaries.
 */

import { os } from "@orpc/server"
import { Schema as S } from "effect"
import { Products } from "@/domains/products"

/**
 * GadgetBot procedures
 */
export const gadgetbots = {
	/**
	 * Get a new GadgetBot template for forms
	 * Returns default values for creating a new gadgetbot
	 */
	new: os.handler(() => {
		return Products.GadgetBot.new()
	}),

	/**
	 * List all GadgetBots
	 * Public access for browsing the rental catalog
	 */
	list: os
		.input(S.standardSchemaV1(S.Struct({})))
		.handler(async () => {
			return await Products.GadgetBot.findAll()
		}),

	/**
	 * Get a single GadgetBot by ID
	 * Public access for viewing details
	 */
	getById: os
		.input(
			S.standardSchemaV1(
				S.Struct({
					id: S.String.pipe(
						S.nonEmptyString(),
						S.annotations({ description: "GadgetBot ID (UUID)" }),
					),
				}),
			),
		)
		.handler(async ({ input }) => {
			return await Products.GadgetBot.findById(input.id)
		}),

	/**
	 * Create a new GadgetBot
	 * Requires admin authorization (TODO: enforce via Zitadel)
	 */
	create: os
		.input(S.standardSchemaV1(Products.GadgetBot.Schemas.CreateInput))
		.handler(async ({ input }) => {
			return await Products.GadgetBot.create(input)
		}),

	/**
	 * Update an existing GadgetBot
	 * Only allows updating batteryLife to reflect actual unit condition
	 * Requires admin authorization (TODO: enforce via Zitadel)
	 */
	update: os
		.input(
			S.standardSchemaV1(
				S.Struct({
					id: S.String.pipe(
						S.nonEmptyString(),
						S.annotations({ description: "GadgetBot ID (UUID)" }),
					),
					data: Products.GadgetBot.Schemas.UpdateInput,
				}),
			),
		)
		.handler(async ({ input }) => {
			return await Products.GadgetBot.update(input.id, input.data)
		}),

	/**
	 * Delete a GadgetBot by ID
	 * Requires admin authorization (TODO: enforce via Zitadel)
	 * Returns the deleted gadgetbot for confirmation
	 */
	deleteById: os
		.input(
			S.standardSchemaV1(
				S.Struct({
					id: S.String.pipe(
						S.nonEmptyString(),
						S.annotations({ description: "GadgetBot ID (UUID)" }),
					),
				}),
			),
		)
		.handler(async ({ input }) => {
			return await Products.GadgetBot.deleteById(input.id)
		}),
}
