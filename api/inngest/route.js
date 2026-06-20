import { serve } from "inngest/next";
import { inngest } from "@/../config/inngest";
import { syncUserCreation, syncUserDeletion, syncUserUpdate, createUserOrder } from "@/config/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncUserCreation,
    syncUserUpdate,
    syncUserDeletion,
    createUserOrder,
  ],
});