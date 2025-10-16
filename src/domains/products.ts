/**
 * Products Domain API
 *
 * Domain module for product-related resources in the GadgetBot rental service.
 * Following Elixir Ash DDD patterns.
 *
 * This module exports the Products domain which controls access to product resources.
 * All client interactions (oRPC, forms) should go through this domain API.
 * Future: Will handle authorization policies via Zitadel before delegating to resources.
 */

import { GadgetBot as GadgetBotResource } from "./products/gadgetbot.js"

/**
 * Products Domain
 * Controls access to product-related resources with authorization
 */
export const Products = {
	/**
	 * GadgetBot operations
	 * Future: Will check auth policies before delegating to resource
	 */
	GadgetBot: {
		// Operations
		/**
		 * Returns a new GadgetBot template for forms
		 */
		new: GadgetBotResource.new,

		/**
		 * Creates a new GadgetBot
		 * Future: Will check admin authorization via Zitadel
		 */
		create: async (...args: Parameters<typeof GadgetBotResource.create>) => {
			// TODO: Check authorization (admin only)
			// await checkPolicy('gadgetbot:create')
			return GadgetBotResource.create(...args)
		},

		/**
		 * Find all GadgetBots
		 * Public access for browsing catalog
		 */
		findAll: GadgetBotResource.findAll,

		/**
		 * Find a GadgetBot by ID
		 * Public access for viewing details
		 */
		findById: GadgetBotResource.findById,

		/**
		 * Update a GadgetBot
		 * Future: Will check admin authorization via Zitadel
		 */
		update: async (...args: Parameters<typeof GadgetBotResource.update>) => {
			// TODO: Check authorization (admin only)
			// await checkPolicy('gadgetbot:update')
			return GadgetBotResource.update(...args)
		},

		/**
		 * Delete a GadgetBot by ID
		 * Future: Will check admin authorization via Zitadel
		 */
		deleteById: async (
			...args: Parameters<typeof GadgetBotResource.deleteById>
		) => {
			// TODO: Check authorization (admin only)
			// await checkPolicy('gadgetbot:delete')
			return GadgetBotResource.deleteById(...args)
		},

		// Effect Schemas for API layer (oRPC, forms)
		Schemas: GadgetBotResource.Schemas,

		// TypeScript types for consumers
		Types: GadgetBotResource.Types,
	},
}