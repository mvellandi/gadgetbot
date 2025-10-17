/**
 * Products Domain API
 *
 * Domain module for product-related resources in the GadgetBot rental service.
 * Following Elixir Ash DDD patterns.
 *
 * This module exports the Products domain which controls access to product resources.
 * All client interactions (oRPC, forms) should go through this domain API.
 * Handles authorization policies via Zitadel before delegating to resources.
 */

import { GadgetBot as GadgetBotResource } from "./products/gadgetbot.js"
import { UnauthorizedError } from "@/lib/errors"
import type { User } from "@/auth/types"

/**
 * Authorization helper: Check if user is authenticated
 */
function requireAuth(user: User | null | undefined): asserts user is User {
	if (!user) {
		throw new UnauthorizedError("Authentication required")
	}
}

/**
 * Authorization helper: Check if user is admin
 * For now, any authenticated user is considered admin
 * Future: Check Zitadel roles/permissions
 */
function requireAdmin(user: User | null | undefined): asserts user is User {
	requireAuth(user)
	// TODO: Check Zitadel roles when roles are configured
	// const roles = user.roles || []
	// if (!roles.includes('admin')) {
	//   throw new ForbiddenError('Admin role required')
	// }
}

/**
 * Products Domain
 * Controls access to product-related resources with authorization
 */
export const Products = {
	/**
	 * GadgetBot operations with authorization policies
	 */
	GadgetBot: {
		// Operations
		/**
		 * Returns a new GadgetBot template for forms
		 * Requires admin authorization
		 */
		new: (user: User | null | undefined) => {
			requireAdmin(user)
			return GadgetBotResource.new()
		},

		/**
		 * Creates a new GadgetBot
		 * Requires admin authorization
		 */
		create: async (
			user: User | null | undefined,
			...args: Parameters<typeof GadgetBotResource.create>
		) => {
			requireAdmin(user)
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
		 * Requires admin authorization
		 */
		update: async (
			user: User | null | undefined,
			...args: Parameters<typeof GadgetBotResource.update>
		) => {
			requireAdmin(user)
			return GadgetBotResource.update(...args)
		},

		/**
		 * Delete a GadgetBot by ID
		 * Requires admin authorization
		 */
		deleteById: async (
			user: User | null | undefined,
			...args: Parameters<typeof GadgetBotResource.deleteById>
		) => {
			requireAdmin(user)
			return GadgetBotResource.deleteById(...args)
		},

		// Bot specifications - fixed characteristics for each bot type
		Specs: GadgetBotResource.Specs,

		// Effect Schemas for API layer (oRPC, forms)
		Schemas: GadgetBotResource.Schemas,

		// TypeScript types for consumers
		Types: GadgetBotResource.Types,
	},
}