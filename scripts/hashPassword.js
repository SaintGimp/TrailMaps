#!/usr/bin/env node
/**
 * CLI tool to generate bcrypt password hashes for AUTH_USERS environment variable.
 *
 * Usage:
 *   node scripts/hashPassword.js <password>
 *   node scripts/hashPassword.js <username> <password>
 *
 * Examples:
 *   node scripts/hashPassword.js mysecretpassword
 *   node scripts/hashPassword.js admin mysecretpassword
 *
 * The output can be added to AUTH_USERS environment variable:
 *   AUTH_USERS=user1:$2b$10$...,user2:$2b$10$...
 */

import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage:");
    console.log("  node scripts/hashPassword.js <password>");
    console.log("  node scripts/hashPassword.js <username> <password>");
    console.log("");
    console.log("Examples:");
    console.log("  node scripts/hashPassword.js mysecretpassword");
    console.log("  node scripts/hashPassword.js admin mysecretpassword");
    process.exit(1);
  }

  let username = null;
  let password;

  if (args.length === 1) {
    password = args[0];
  } else {
    username = args[0];
    password = args[1];
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);

  console.log("");
  if (username) {
    console.log(`Username: ${username}`);
  }
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log("");

  if (username) {
    console.log("Add to AUTH_USERS environment variable:");
    console.log(`  ${username}:${hash}`);
  } else {
    console.log("Hash to use in AUTH_USERS:");
    console.log(`  <username>:${hash}`);
  }
}

main().catch(console.error);
