// src/inngest/client.ts
import { Inngest } from "inngest";
import connectToDatabase from "@/config/db";
import User from "@/models/User";
import Order from "@/models/oder";

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
        const { id, email_addresses, first_name, last_name, image_url } = event.data;
        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            name: `${first_name} ${last_name}`,
            imageUrl: image_url,
        }
        await connectToDatabase();
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
        const { id, email_addresses, first_name, last_name, image_url } = event.data;
        const userData = {
            email: email_addresses[0].email_address,
            name: `${first_name} ${last_name}`,
            imageUrl: image_url,
        }
        await connectToDatabase();
        await User.findByIdAndUpdate(id, userData);
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
        const { id } = event.data;
        await connectToDatabase();
        await User.findByIdAndDelete(id);
    }
);

/**
 * inngest function to create user's order in database
 */
export const createUserOrder = inngest.createFunction(
    {
        id: "create-user-order",
        batchEvents: {
            maxSize: 5,
            timeout: "5s",
        },
    },
    {
        event: "order/created",
    },
    async ({ events }) => {
        const orders = events.map((event) => ({
            userId: event.data.userId,
            addressId: event.data.addressId,
            products: event.data.products,
            totalAmount: event.data.totalAmount,
        }));

        await connectToDatabase();
        await Order.insertMany(orders);

        return { success: true, processed: orders.length };
    }
);
/**
 * inngest function to create users in database
 */

export const createUserOder = inngest.createFunction(
    {
        id: "create-user-order",
        batchEvents: {
            maxSize: 15,
            timeout: "5s",
        },
    },
    {
        event: "order/created",
    },
    async ({ events }) => {
        const orders = events.map((event) => ({
            userId: event.data.userId,
            addressId: event.data.addressId,
            products: event.data.products,
            totalAmount: event.data.totalAmount,
        }));

        await connectToDatabase();
        await Order.insertMany(orders);

        return { success: true, processed: orders.length };
    }
);  