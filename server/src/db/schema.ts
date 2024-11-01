import { pgTable,varchar,boolean, serial } from "drizzle-orm/pg-core";

export const Todos = pgTable("todos", {
    id:serial("id").notNull().primaryKey(),
    content:varchar("content",{length: 255}).notNull(),
    completed:boolean("completed").default(false)
})