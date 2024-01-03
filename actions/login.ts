"use server";

import { signIn } from "@/auth";
import { getUserByEmail } from "@/data/user";
import { sendVerificationEmail } from "@/lib/mail";
import { generateVerificationToken } from "@/lib/token";
import { DEFAULT_LOGIN_REDIRECT } from "@/route";
import { LoginSchema } from "@/schemas";
import { AuthError } from "next-auth";
import * as z from "zod";

export async function login(values: z.infer<typeof LoginSchema>) {
    try {
        const validatedFields = LoginSchema.safeParse(values)

        if (!validatedFields.success) throw new Error("Ivalid fields!")

        const { email, password } = validatedFields.data

        const existingUser = await getUserByEmail(email)

        if (!existingUser || !existingUser.email || !existingUser.password) throw new Error("Invalid Credentials!")

        if (!existingUser.emailVerified) {
            const verificationToken = await generateVerificationToken(existingUser.email)

            await sendVerificationEmail(
                verificationToken.email,
                verificationToken.token
            )

            return { success: "Confirmation Email send!" }
        }

        await signIn("credentials", {
            email,
            password,
            redirectTo: DEFAULT_LOGIN_REDIRECT
        })

        return { success: "Logged In" }

    } catch (error: any) {
        // console.log(error)
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    throw new Error("Invalid Credentials!")
                default:
                    throw new Error("Something went wrong")
            }
        }
        throw new Error("Something went wrong");
    }
}