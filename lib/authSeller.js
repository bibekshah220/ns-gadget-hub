import { clerkClient } from '@clerk/nextjs/server';

const authSeller = async (userId) => {
    try {
        if (!userId) {
            return false;
        }

        const client = await clerkClient()
        const user = await client.users.getUser(userId)

        return user.publicMetadata.role === 'seller';
    } catch (error) {
        console.error("authSeller error:", error);
        return false;
    }
}

export default authSeller;