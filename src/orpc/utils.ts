import { Schema as S } from "effect"

/**
 * Helper to wrap Effect Schema Struct for oRPC input
 * Automatically applies standardSchemaV1 wrapper
 */
export const Struct = <Fields extends S.Struct.Fields>(fields: Fields) => {
	return S.standardSchemaV1(S.Struct(fields) as unknown as S.Schema<any, any, never>)
}

/**
 * Helper to wrap Effect Schema for oRPC input
 * Automatically applies standardSchemaV1 wrapper
 */
export const Schema = <A, I = A, R = never>(schema: S.Schema<A, I, R>) => {
	return S.standardSchemaV1(schema as unknown as S.Schema<A, I, never>)
}

// Re-export S for convenience
export { S }