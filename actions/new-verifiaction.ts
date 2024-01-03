"use server"

import { getUserByEmail } from "@/data/user"
import { getVerificationTokenByToken } from "@/data/verification-token"
import { db } from "@/lib/db"

export const newVerification = async (token: string) => {
    try {
        const existingToken = await getVerificationTokenByToken(token)

        if (!existingToken) throw new Error("Token Not Exists!")

        const hasExpired = new Date(existingToken.expires) < new Date()

        if (hasExpired) {
            throw new Error("Token has Exipred")
        }

        const existingUser = await getUserByEmail(existingToken.email)

        if (!existingUser) throw new Error("No User Found For this token")

        await db.user.update({
            where: {
                id: existingUser.id
            },
            data: {
                emailVerified: new Date(),
                email: existingUser.email
            }
        })

        await db.verificationToken.delete({
            where: { id: existingToken.id }
        })

        return { success: "Email verified Successfully" }

    } catch (error) {
        throw error
    }
}