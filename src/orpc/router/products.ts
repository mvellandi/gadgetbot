/**
 * Products oRPC Router
 *
 * Type-safe RPC endpoints for GadgetBot product management.
 * Used by web client, CLI, and external API consumers.
 *
 * Only interacts with the Products domain API - maintains clean boundaries.
 * Passes authenticated user from context to domain for authorization.
 */

import { os } from "@orpc/server"
import { Products } from "@/domains/products"
import type { Context } from "@/orpc/context"
import { Struct, Schema, S } from "../utils"

/**
 * Create oRPC server instance with Context type
 */
const server = os.$context<Context>()

/**
 * GadgetBot procedures
 * All procedures receive context with user session for authorization
 */
export const gadgetbots = {
	/**
	 * Get a new GadgetBot template for forms
	 * Returns default values for creating a new gadgetbot
	 * Requires admin authorization
	 */
	new: server.handler(({ context }) => {
		return Products.GadgetBot.new(context.user)
	}),

	/**
	 * List all GadgetBots
	 * Requires admin authorization (internal inventory management)
	 */
	list: server.handler(async ({ context }) => {
		return await Products.GadgetBot.findAll(context.user)
	}),

	/**
	 * Get a single GadgetBot by ID
	 * Requires admin authorization (internal inventory management)
	 */
	getById: server
		.input(
			Struct({
				id: S.String.pipe(
					S.nonEmptyString(),
					S.annotations({ description: "GadgetBot ID (UUID)" }),
				),
			}),
		)
		.handler(async ({ input, context }) => {
			return await Products.GadgetBot.findById(context.user, input.id)
		}),

	/**
	 * Create a new GadgetBot
	 * Requires admin authorization
	 */
	create: server
		.input(Schema(Products.GadgetBot.Schemas.CreateInput))
		.handler(async ({ input, context }) => {
			return await Products.GadgetBot.create(context.user, input)
		}),

	/**
	 * Update an existing GadgetBot
	 * Only allows updating batteryLife to reflect actual unit condition
	 * Requires admin authorization
	 */
	update: server
		.input(
			Struct({
					id: S.String.pipe(
						S.nonEmptyString(),
						S.annotations({ description: "GadgetBot ID (UUID)" }),
					),
					data: Products.GadgetBot.Schemas.UpdateInput,
				}),
		)
		.handler(async ({ input, context }) => {
			return await Products.GadgetBot.update(context.user, input.id, input.data)
		}),

	/**
	 * Delete a GadgetBot by ID
	 * Requires admin authorization
	 * Returns the deleted gadgetbot for confirmation
	 */
	deleteById: server
		.input(
			Struct({
					id: S.String.pipe(
						S.nonEmptyString(),
						S.annotations({ description: "GadgetBot ID (UUID)" }),
					),
				}),
		)
		.handler(async ({ input, context }) => {
			return await Products.GadgetBot.deleteById(context.user, input.id)
		}),
}
