// src/inngest/client.ts
import { User } from "@clerk/nextjs/server";
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "NS-Gadget-Hub" });

/**
 * inggest function to save user data to a database
 */

export const syncUserCreation = inngest.createFunction(
    {
  id: "sync-user-from-clerk",
     },
     {
        event: "clerk/user.created",
     },
     async ({ event }) => {
        const { _id, email_addresses, first_name, last_name, image_url } = event.data;
        const userData = {
            _id: _id,
            email: email_addresses[0].email_address,
            name: `${first_name} ${last_name}`,
            imageUrl: image_url,
        }
        await connectDB();
        await User.create(userData);
     }
);

/**
 * Inngest Function to update data in database
 */

export const syncUserUpdate = inngest.createFunction(
    {
        id: "Update-user-from-clerk",
    },
    {
        event: "clerk/user.updated",
    },
    async ({ event }) => {
        const { _id, email_addresses, first_name, last_name, image_url } = event.data;
        const userData = {
            email: email_addresses[0].email_address,
            name: `${first_name} ${last_name}`,
            imageUrl: image_url,
        }
        await connectDB();
        await User.findByIdAndUpdate(_id, userData);
    }
);

/**
 * Inngest Function to delete data from database
 */
export const syncUserDeletion = inngest.createFunction(
    {
        id: "Delete-user-with-clerk",
    },
    {
        event: "clerk/user.deleted",
    },
    async ({ event }) => {
        const { _id } = event.data;
        await connectDB();
        await User.findByIdAndDelete(_id);
    }
);