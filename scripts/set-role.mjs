/*
 * Grant or revoke seller access:
 *
 *   npm run role -- you@example.com seller
 *   npm run role -- you@example.com user
 *   npm run role                              (lists every account)
 *
 * Role is read from the DB on every request, so the change takes effect on the
 * next click. No sign-out needed.
 */
import mongoose from "mongoose";

const ROLES = ["user", "seller", "admin"];
const [email, role] = process.argv.slice(2);

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set in .env");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const users = mongoose.connection.db.collection("users");

/* No arguments: show who exists and what they are. */
if (!email) {
  const all = await users.find({}, { projection: { email: 1, name: 1, role: 1 } }).toArray();

  if (all.length === 0) {
    console.log("\nNo accounts yet. Register at /register first.\n");
  } else {
    console.log("");
    for (const u of all) {
      console.log(`  ${(u.role || "user").padEnd(7)} ${u.email}   ${u.name || ""}`);
    }
    console.log(`\n  npm run role -- <email> seller\n`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

if (!ROLES.includes(role)) {
  console.error(`\nUsage: npm run role -- <email> <${ROLES.join("|")}>\n`);
  await mongoose.disconnect();
  process.exit(1);
}

const target = email.trim().toLowerCase();
const user = await users.findOne({ email: target }, { projection: { email: 1, role: 1 } });

if (!user) {
  console.error(`\nNo account with email ${target}. Register it first at /register.\n`);
  await mongoose.disconnect();
  process.exit(1);
}

if ((user.role || "user") === role) {
  console.log(`\n  ${target} is already ${role}. Nothing to change.\n`);
  await mongoose.disconnect();
  process.exit(0);
}

/* Guarded so a re-run is a no-op rather than a second pointless write. */
const result = await users.updateOne(
  { email: target, role: { $ne: role } },
  { $set: { role } },
);

console.log(`\n  ${target}: ${user.role || "user"} -> ${role}  (${result.modifiedCount} updated)`);
console.log(role === "seller" || role === "admin"
  ? "  Seller Dashboard is now in the account menu. Reload the page.\n"
  : "  Seller access removed.\n");

await mongoose.disconnect();
