import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { $ } from 'bun';

describe('Build Order Integration Test', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const distDir = path.join(rootDir, 'dist');
  const bunBuildMarker = path.join(distDir, 'index.js'); // Bun creates this

  beforeAll(async () => {
    // Clean dist directory before test
    if (fs.existsSync(distDir)) {
      await fs.promises.rm(distDir, { recursive: true, force: true });
    }
  });

  afterAll(async () => {
    // Don't clean up after test - keep dist for other tests
  });

  it('should produce correct Bun build outputs', async () => {
    // Run the full build process
    await $`cd ${rootDir} && bun run build`;

    // Check that dist directory exists
    expect(fs.existsSync(distDir)).toBe(true);

    // Check that Bun build outputs exist
    expect(fs.existsSync(bunBuildMarker)).toBe(true);

    // Verify Bun produced its expected outputs
    const distFiles = fs.readdirSync(distDir);

    // Should have Bun outputs (index.js)
    expect(distFiles.some((file) => file === 'index.js')).toBe(true);

    // Should have source maps
    expect(distFiles.some((file) => file.endsWith('.js.map'))).toBe(true);
  }, 30000); // 30 second timeout for build process
});
