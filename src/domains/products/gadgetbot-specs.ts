/**
 * GadgetBot Specifications
 *
 * Static data defining the immutable characteristics of each bot type.
 * Safe to import from both client and server code.
 */

export const BOT_SPECS = {
	cleaning: {
		type: "cleaning" as const,
		description:
			"Advanced cleaning robot with multi-surface detection and adaptive cleaning modes. Perfect for maintaining spotless homes with minimal effort.",
		batteryLife: 8,
		maxLoadCapacity: 15,
		features: [
			"Multi-surface cleaning",
			"Auto-recharge capability",
			"Spot cleaning mode",
			"Edge detection sensors",
			"HEPA filtration system",
		],
		imageUrl: null,
	},
	gardening: {
		type: "gardening" as const,
		description:
			"Autonomous gardening assistant for lawn maintenance and basic landscaping tasks. Weather-resistant design for year-round outdoor use.",
		batteryLife: 12,
		maxLoadCapacity: 25,
		features: [
			"Precision mowing patterns",
			"Weed detection and removal",
			"Weather-resistant housing",
			"Terrain mapping",
			"Solar charging support",
		],
		imageUrl: null,
	},
	security: {
		type: "security" as const,
		description:
			"Intelligent security patrol unit with advanced threat detection capabilities. Provides 24/7 monitoring and immediate alert notifications.",
		batteryLife: 24,
		maxLoadCapacity: 10,
		features: [
			"24/7 autonomous patrol mode",
			"Motion detection sensors",
			"Facial recognition AI",
			"Real-time alert system",
			"Night vision cameras",
			"Emergency response protocol",
		],
		imageUrl: null,
	},
} as const

export type BotType = keyof typeof BOT_SPECS
export type BotSpecs = typeof BOT_SPECS
