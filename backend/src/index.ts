import { Hono } from "hono";
import { userRouter } from "./routes/user";
import { blogRouter } from "./routes/blog";

type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath("/api/v1");

app.route("/user", userRouter);
app.route("/blog", blogRouter);

export default app;
