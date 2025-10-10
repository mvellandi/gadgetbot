import { Schema } from "effect";

export const TodoSchema = Schema.Struct({
	id: Schema.Number.pipe(Schema.int(), Schema.greaterThanOrEqualTo(1)),
	name: Schema.String,
});

export type Todo = typeof TodoSchema.Type;
