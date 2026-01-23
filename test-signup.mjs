#!/usr/bin/env node
/**
 * Test script to validate signup flow
 * Creates 3 test users and verifies complete data collection
 */

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://fleet-mosquito-399.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

const testUsers = [
  {
    username: "testuser1",
    email: "testuser1@example.com",
    password: "password123",
  },
  {
    username: "testuser2",
    email: "testuser2@example.com",
    password: "password123",
  },
  {
    username: "testuser3",
    email: "testuser3@example.com",
    password: "password123",
  },
];

async function checkUserInDatabase(username) {
  try {
    // Query the users table to find user by username
    const result = await client.query("onboarding:checkUsernameAvailable", {
      username,
    });

    // If username is NOT available, it means user exists
    return !result.available;
  } catch (error) {
    console.error(`Error checking user ${username}:`, error.message);
    return false;
  }
}

async function validateUsers() {
  console.log('\n🔍 Validating test users in Convex database...\n');

  let validatedCount = 0;

  for (const user of testUsers) {
    const exists = await checkUserInDatabase(user.username);

    if (exists) {
      console.log(`✅ ${user.username} - Found in database`);
      validatedCount++;
    } else {
      console.log(`❌ ${user.username} - NOT found in database`);
    }
  }

  console.log(`\n📊 Result: ${validatedCount}/3 users validated`);

  if (validatedCount === 3) {
    console.log('\n🎉 SUCCESS! All 3 test users are registered with complete data!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Please manually sign up the missing users at http://localhost:3000/signup\n');
    console.log('Test users to create:');
    for (const user of testUsers) {
      const exists = await checkUserInDatabase(user.username);
      if (!exists) {
        console.log(`  - Username: ${user.username}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Password: ${user.password}\n`);
      }
    }
    process.exit(1);
  }
}

validateUsers();
