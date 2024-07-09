import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { createPostInput, updatePostInput } from "@mohdyasirkn/medium-blog-val";

type BlogRouterConfig = {
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  };
  Variables: {
    userId: string;
  };
};
export const blogRouter = new Hono<BlogRouterConfig>();

blogRouter.use("/*", async (c, next) => {
  const jwt = c.req.header("Authorization") || "";

  if (!jwt) {
    c.status(401);
    return c.json({ error: "unauthorized" });
  }
  const token = jwt.split(" ")[1];
  try {
    const user = await verify(token, c.env.JWT_SECRET);

    if (!user) {
      c.status(403);
      return c.json({ message: "Authentication failed not loggd in" });
    }

    c.set("userId", String(user.id));
    await next();
  } catch (error) {
    c.status(403);
    return c.json({ message: "Authentication failed not loggd in" });
  }
});

blogRouter.post("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const { success } = createPostInput.safeParse(body);
  console.log(success);

  if (!success) {
    c.status(400);
    return c.json({
      error: "incorrect inputs",
    });
  }
  const userId = await c.get("userId");
  try {
    const blog = await prisma.post.create({
      data: {
        content: body.content,
        title: body.title,
        pulished: body.published,
        authorID: Number(userId),
      },
    });

    return c.json({ id: blog.id });
  } catch (error) {
    return c.json({ error: "errorbp" });
  }
});

blogRouter.put("/", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const { success } = updatePostInput.safeParse(body);
  if (!success) {
    c.status(400);
    return c.json({
      error: "incorrect inputs",
    });
  }
  const userId = await c.get("userId");
  try {
    const blog = await prisma.post.update({
      where: { id: body.id, authorID: Number(userId) },
      data: { title: body.title, content: body.content },
    });

    return c.text("Blog updated");
  } catch (error) {
    return c.json({ error: "error" });
  }
});

blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const blog = await prisma.post.findMany();
    return c.json(blog);
  } catch (error) {
    return c.json({ error: "error" });
  }
});

blogRouter.get("/:id", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const id = parseInt(c.req.param("id"));
  try {
    const blog = await prisma.post.findUnique({ where: { id } });
    return c.json(blog);
  } catch (error) {
    return c.json({ error: "error" });
  }
});
