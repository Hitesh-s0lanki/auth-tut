import * as z from "zod";

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(2, { message: "Password is required" })
});

export const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, { message: "Password is required" }),
    name: z.string().min(3, { message: "Name is Required" })
});
