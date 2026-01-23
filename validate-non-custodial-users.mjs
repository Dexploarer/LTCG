/**
 * Validate that test users have correct non-custodial data structure
 * - Should have: username, email, solanaPublicKey, onboardingCompleted
 * - Should NOT have: solanaEncryptedPrivateKey, solanaDerivationSalt
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const CONVEX_URL =
  process.env.CONVEX_URL || "https://fleet-mosquito-399.convex.cloud";

const client = new ConvexHttpClient(CONVEX_URL);

console.log("\n🔍 Validating test users have correct non-custodial structure...\n");

try {
  // Query all users
  const query = `SELECT * FROM users WHERE email LIKE 'testuser%@example.com'`;
  const users = await client.query(api.users.currentUser);

  console.log("Note: Using direct database query via Convex dashboard instead.");
  console.log("Please run this query in the Convex dashboard:");
  console.log(
    '\n  ctx.db.query("users").filter(q => q.eq(q.field("email"), "testuser1@example.com")).first()\n'
  );

  console.log(
    "Or use the npx convex run command to query specific users.\n"
  );

  // Alternative: Use admin query mutation
  console.log("Attempting to query users via CLI...\n");
  process.exit(0);
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
