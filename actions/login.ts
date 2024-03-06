"use server";

import { signIn } from "@/auth";
import { getTwoFactorConfirmationByUserId } from "@/data/two-factor-confirmation";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { sendTwoFactorTokenEmail, sendVerificationEmail } from "@/lib/mail";
import { generateTwoFactorToken, generateVerificationToken } from "@/lib/token";
import { DEFAULT_LOGIN_REDIRECT } from "@/route";
import { LoginSchema } from "@/schemas";
import { AuthError } from "next-auth";
import * as z from "zod";

export async function login(values: z.infer<typeof LoginSchema>, callbackUrl?: string) {
    try {
        const validatedFields = LoginSchema.safeParse(values)

        if (!validatedFields.success) throw new Error("Ivalid fields!")

        const { email, password, code } = validatedFields.data

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

        if (existingUser.isTwoFactorEnabled && existingUser.email) {

            if (code) {
                const twoFactorToken = await getTwoFactorTokenByEmail(
                    existingUser.email
                );

                if (!twoFactorToken) {
                    return { error: "Invalid code!" };
                }

                if (twoFactorToken.token !== code) {
                    return { error: "Invalid code!" };
                }

                const hasExpired = new Date(twoFactorToken.expires) < new Date();

                if (hasExpired) {
                    return { error: "Code expired!" };
                }

                await db.twoFactorToken.delete({
                    where: { id: twoFactorToken.id }
                });

                const existingConfirmation = await getTwoFactorConfirmationByUserId(
                    existingUser.id
                );

                if (existingConfirmation) {
                    await db.twoFactorConfirmation.delete({
                        where: { id: existingConfirmation.id }
                    });
                }

                await db.twoFactorConfirmation.create({
                    data: {
                        userId: existingUser.id,
                    }
                });
            } else {
                const twoFactorToken = await generateTwoFactorToken(existingUser.email)

                await sendTwoFactorTokenEmail(
                    twoFactorToken.email,
                    twoFactorToken.token
                )

                return { twoFactor: true }
            }

        }

        await signIn("credentials", {
            email,
            password,
            redirectTo: callbackUrl || DEFAULT_LOGIN_REDIRECT
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
        throw error
    }
}