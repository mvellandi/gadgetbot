/**
 * Standard Error classes for domain APIs
 *
 * These are thrown by domain operations and can be caught by
 * route handlers and oRPC procedures.
 */

/**
 * Thrown when a requested resource is not found
 */
export class NotFoundError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "NotFoundError"
	}
}

/**
 * Thrown when input validation fails
 */
export class ValidationError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "ValidationError"
	}
}

/**
 * Thrown when a database operation fails
 */
export class DatabaseError extends Error {
	constructor(message: string, public cause?: unknown) {
		super(message)
		this.name = "DatabaseError"
	}
}

/**
 * Thrown when authentication is required but not provided
 */
export class UnauthorizedError extends Error {
	constructor(message: string = "Authentication required") {
		super(message)
		this.name = "UnauthorizedError"
	}
}

/**
 * Thrown when user lacks required permissions
 */
export class ForbiddenError extends Error {
	constructor(message: string = "Insufficient permissions") {
		super(message)
		this.name = "ForbiddenError"
	}
}
