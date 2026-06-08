// src/inngest/client.ts
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
     }
);
 