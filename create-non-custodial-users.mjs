/**
 * Create 3 test users with truly non-custodial wallets
 * Uses admin mutation to create users with ONLY public keys
 */

import { ConvexHttpClient } from "convex/browser";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { api } from "./convex/_generated/api.js";

const CONVEX_URL = process.env.CONVEX_URL || "https://fleet-mosquito-399.convex.cloud";

const client = new ConvexHttpClient(CONVEX_URL);

const testUsers = [
  {
    email: "testuser1@example.com",
    username: "testuser1",
  },
  {
    email: "testuser2@example.com",
    username: "testuser2",
  },
  {
    email: "testuser3@example.com",
    username: "testuser3",
  },
];

console.log("\n🔐 Creating 3 test users with non-custodial wallets...\n");

const results = [];

for (const user of testUsers) {
  console.log(`\n📝 Creating ${user.username} (${user.email})...`);

  try {
    // Step 1: Generate Solana wallet CLIENT-SIDE (truly non-custodial!)
    console.log("  ⚡ Generating Solana wallet client-side...");
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toBase58();
    const privateKey = bs58.encode(keypair.secretKey);

    console.log(`  ✅ Wallet generated!`);
    console.log(`     Public Key:  ${publicKey}`);
    console.log(`     Private Key: ${privateKey.substring(0, 20)}...`);

    // Step 2: Create user with admin mutation (sends ONLY public key)
    console.log("  🔧 Creating user in database (PUBLIC KEY ONLY)...");

    const createResult = await client.mutation(api.admin.createTestUser, {
      email: user.email,
      username: user.username,
      solanaPublicKey: publicKey, // ONLY public key sent to server!
    });

    if (!createResult.success) {
      throw new Error(createResult.message);
    }

    console.log(`  ✅ User created: ${createResult.message}`);

    // Step 3: Store result (including private key for testing purposes)
    results.push({
      username: user.username,
      email: user.email,
      publicKey: publicKey,
      privateKey: privateKey, // In real app, this is shown ONCE and never stored
      userId: createResult.userId,
      onboardingCompleted: true,
    });

    console.log(`✅ ${user.username} created successfully!`);
  } catch (error) {
    console.error(`❌ Failed to create ${user.username}:`, error.message);
    results.push({
      username: user.username,
      email: user.email,
      error: error.message,
    });
  }
}

// Print final summary
console.log("\n" + "=".repeat(80));
console.log("📊 TEST USERS CREATED - NON-CUSTODIAL WALLETS");
console.log("=".repeat(80));
console.log(
  "\n⚠️  IMPORTANT: Private keys are shown here for testing purposes only!"
);
console.log("⚠️  In production, private keys are shown ONCE and NEVER stored!\n");

for (const result of results) {
  if (result.error) {
    console.log(`❌ ${result.username} - FAILED`);
    console.log(`   Error: ${result.error}\n`);
  } else {
    console.log(`✅ ${result.username} - SUCCESS`);
    console.log(`   Email: ${result.email}`);
    console.log(`   User ID: ${result.userId}`);
    console.log(`   Public Key:  ${result.publicKey}`);
    console.log(`   Private Key: ${result.privateKey}`);
    console.log(
      `   ⚠️  Save this private key! It's the ONLY copy (not stored on server)\n`
    );
  }
}

console.log("=".repeat(80));
console.log("\n✨ Done! All test users created with truly non-custodial wallets.");
console.log(
  "💡 Each user's private key is shown above - in production, users see this ONCE.\n"
);

process.exit(0);
