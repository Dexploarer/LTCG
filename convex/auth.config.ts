/**
 * Convex Auth Configuration
 *
 * SECURITY: Configure Privy JWT verification using Custom JWT provider
 * Privy JWTs use ES256 algorithm with issuer "privy.io"
 *
 * Uses Privy's public JWKS endpoint for automatic key rotation support.
 * See: https://docs.privy.io/authentication/user-authentication/access-tokens
 */

// Privy App ID - hardcoded for now to debug auth issues
const PRIVY_APP_ID = "cml0fnzn501t7lc0buoz8kt74";

export default {
  providers: [
    {
      type: "customJwt",
      // Privy JWT issuer is just "privy.io" (not a URL)
      issuer: "privy.io",
      // ES256 (ECDSA with P-256 curve)
      algorithm: "ES256",
      // Privy App ID - must match the "aud" claim in JWTs
      applicationID: PRIVY_APP_ID,
      // Use Privy's public JWKS endpoint (supports key rotation)
      jwks: `https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`,
    },
  ],
};
