import { db } from "@/lib/db"

export async function getUserByEmail(email: string) {
    try {
        const user = await db.user.findUnique({
            where: {
                email
            }
        })

        return user
    } catch (error: any) {
        console.log(error.message)
        throw error
    }
}

export async function getUserById(id: string) {
    try {
        const user = await db.user.findUnique({
            where: {
                id
            }
        })

        return user
    } catch (error: any) {
        console.log(error.message)
        throw error
    }
}