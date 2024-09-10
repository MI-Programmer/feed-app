import { z } from "zod";

export const userSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email"),
  name: z
    .string({ required_error: "Name is required" })
    .min(5, "Name must be 5 characters"),
  password: z
    .string({ required_error: "Password is required" })
    .min(5, "Password must be 5 characters"),
});

export const postSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(5, "Title must be 5 characters"),
  imageUrl: z.string({ required_error: "Image url is required" }),
  content: z
    .string({ required_error: "Content is required" })
    .min(5, "Content must be 5 characters"),
});
