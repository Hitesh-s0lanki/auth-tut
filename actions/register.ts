"use server";

import { RegisterSchema } from "@/schemas";
import * as z from "zod";
import { db } from "@/lib/db";
import bcryptjs from 'bcryptjs';
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "@/lib/mail";

export async function register(values: z.infer<typeof RegisterSchema>) {
    try {
        const validatedFields = RegisterSchema.safeParse(values)

        if (!validatedFields.success) throw new Error("Ivalid fields!")

        const { email, name, password } = validatedFields.data;
        const hashPassword = await bcryptjs.hash(password, 10)

        const existingUser = await getUserByEmail(email)

        if (existingUser) return { error: "User Already Exist!" }

        await db.user.create({
            data: {
                name,
                email,
                password: hashPassword
            }
        })

        const verificationToken = await generateVerificationToken(email)

        await sendVerificationEmail(
            verificationToken.email,
            verificationToken.token
        )

        return { success: "Confirmation email send!" }

    } catch (error: any) {
        console.log(error.mesaage)
        throw error
    }
}