import { os } from "@orpc/server";
import { Schema } from "effect";

const todos = [
	{ id: 1, name: "Get groceries" },
	{ id: 2, name: "Buy a new phone" },
	{ id: 3, name: "Finish the project" },
];

export const listTodos = os
	.input(Schema.standardSchemaV1(Schema.Struct({})))
	.handler(() => {
		return todos;
	});

export const addTodo = os
	.input(Schema.standardSchemaV1(Schema.Struct({ name: Schema.String })))
	.handler(({ input }) => {
		const newTodo = { id: todos.length + 1, name: input.name };
		todos.push(newTodo);
		return newTodo;
	});
