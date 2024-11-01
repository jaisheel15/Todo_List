import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import {logger} from "hono/logger";
import {drizzle} from 'drizzle-orm/neon-http';
import {Todos} from './db/schema';
import { toEditorSettings } from "typescript";
const app = new Hono();
app.use(logger());

app.use('*', (c, next) => {
  c.header('Access-Control-Allow-Origin', '*'); // Allow all origins
  c.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS','PUT'); // Allow desired methods
  c.header('Access-Control-Allow-Headers', '*'); // Allow all headers
  return next();
});



const db = drizzle(process.env.DATABASE_URL!);

const Todo_Schema = z.object({
  content: z.string().min(1),
  completed: z.boolean().default(false),
});

//This is for the testing of the endpoints
// const createTodo = (content: string, completed: boolean) => {
//   const id = uuidv4();
//   const newtodo = Todo_Schema.parse({ id, content, completed });
//   return newtodo;
// };

// const todos = [
//   createTodo("test", true),
//   createTodo("test2", false),
//   createTodo("test3", false),
// ];

app.get("/", async (c) => {
  const todoss = await db.select().from(Todos);
  return c.json(todoss, 200);
});

app.post("/", zValidator("json", Todo_Schema), async (c) => {
  const data = c.req.valid("json");
  if (data) {
    const todo:typeof Todos.$inferInsert={
      content: data.content,
      completed: data.completed
    }
   await db.insert(Todos).values(todo);
    return c.json({ message: "Success" }, 200);
  } else {
    return c.json({ message: "Error" }, 400);
  }
});
// async function list(){
//   const id = 1
// const ids= await db.select().from(Todos).where(eq(Todos.id,id))
// console.log(ids);

// } 
// list()
//get a todo based on it's id 
app.get('/:id', async (c)=>{
  const id  = Number(c.req.param('id')) 
  const todo = await db.select().from(Todos).where(eq(Todos.id,id ));
  if(todo.length>0){
    return c.json(todo,200);
  }else{
    return c.json({message: 'Todo not found'},404);
  }
})

app.patch(
  "/:id",
  zValidator("json", z.object({ content: z.string().optional() , completed: z.boolean().optional() })),
  async (c) => {
    const id = Number(c.req.param("id"));
    const data = c.req.valid("json");

    const todo = await db.select().from(Todos).where(eq(Todos.id,id ));
    if (todo) {
      if (data.content) {
        todo[0].content = data.content;
      }
      else if (data.completed) {
        todo[0].completed = data.completed;
      }
      else if(data.completed && data.content){
        todo[0].content = data.content;
        todo[0].completed = data.completed;
      }
      await db.update(Todos).set(todo[0]).where(eq(Todos.id,id ));
      return c.json({ message: "Updated" }, 200);
    } else {
      return c.json({ message: "Todo Does not Exist" }, 404);
    }
  }
);

app.delete("/:id", async (c) => {
    try {
        const id = Number(c.req.param("id"));
        const result = await db.delete(Todos).where(eq(Todos.id, id));

        if (result.rowCount > 0) {
            return c.json({ message: "Deleted" }, 200);
        } else {
            return c.json({ message: "Todo not found" }, 404);
        }
    } catch (error) {
        console.error(error);
        return c.json({ message: "Internal Server Error" }, 500);
    }
});
export default app;
