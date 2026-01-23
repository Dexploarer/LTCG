# Wallet Architecture (2026 Pattern)

## Overview

LTCG uses a **dual wallet system** with backend-generated non-custodial wallets as the primary approach, and optional external wallet support.

## Architecture

### 1. Backend-Generated Wallets (Primary)

**Location**: [convex/onboarding.ts](../convex/onboarding.ts)

Users get Solana wallets automatically during onboarding:
- ✅ Solana keypair generated on backend
- ✅ Private key encrypted with AES-GCM 256-bit
- ✅ Password-protected (PBKDF2 100,000 iterations)
- ✅ Stored in Convex database
- ✅ Non-custodial (user owns keys)

**Advantages**:
- Zero friction onboarding
- No wallet extension required
- Works on mobile and desktop
- User-controlled keys

### 2. External Wallets (Optional)

**Location**: [src/components/WalletProvider.tsx](../src/components/WalletProvider.tsx)

Support for external wallets via Solana Wallet Adapter:
- Phantom
- Solflare
- Any standard Solana wallet

**Hook**: [src/hooks/useDualWallet.ts](../src/hooks/useDualWallet.ts)

```typescript
const { appWallet, externalWallet, hasAppWallet, hasExternalWallet } = useDualWallet();
```

## Implementation Details

### WalletProvider (2026 Pattern)

**Features**:
1. **Client-side only mounting** - Prevents SSR/hydration issues
2. **Empty wallets array** - Avoids auto-detection conflicts with browser extensions
3. **Error boundary protection** - Catches and suppresses extension conflicts
4. **No auto-connect** - Users explicitly choose connection method

### Error Handling

**Location**: [src/components/WalletErrorBoundary.tsx](../src/components/WalletErrorBoundary.tsx)

Catches errors from:
- Browser wallet extensions injecting into page
- JSON parsing errors from extension scripts
- Wallet adapter initialization conflicts

**Behavior**:
- Suppresses non-critical extension errors
- Shows fallback UI for critical errors
- Continues app functionality with backend wallets

## Provider Stack

```
<ConvexAuthProvider>           ← Authentication
  <WalletErrorBoundary>         ← Error protection
    <WalletProvider>            ← Solana connection
      <LayoutWrapper>           ← Navigation
        {children}
      </LayoutWrapper>
    </WalletProvider>
  </WalletErrorBoundary>
</ConvexAuthProvider>
```

## Best Practices (2026)

### ✅ Do
- Use backend-generated wallets for primary UX
- Mount WalletProvider client-side only
- Wrap with error boundary
- Empty wallets array to prevent conflicts
- Disable autoConnect
- Support both wallet types via useDualWallet

### ❌ Don't
- Don't auto-detect external wallets (causes conflicts)
- Don't use autoConnect (user chooses connection)
- Don't initialize wallet adapters during SSR
- Don't force external wallet connection
- Don't expose raw private keys to frontend

## Security

### Backend Wallet Security
- Private keys encrypted with user password
- Password never stored (only used for encryption)
- PBKDF2 key derivation (100,000 iterations)
- AES-GCM 256-bit encryption
- No recovery mechanism (password = key)

### External Wallet Security
- User manages keys via wallet extension
- Transaction signing handled by wallet
- No private key exposure to app

## Future Enhancements

1. **Multi-wallet support** - Let users manage multiple wallets
2. **Hardware wallet support** - Ledger, Trezor integration
3. **Social recovery** - Optional key recovery mechanisms
4. **Gas abstraction** - Backend pays transaction fees
5. **Account abstraction** - Smart contract wallets

## Migration Notes

If migrating from older patterns:
- Remove PhantomWalletAdapter/SolflareWalletAdapter initialization
- Replace autoConnect with explicit user choice
- Add error boundary for extension conflicts
- Use client-side mounting pattern
- Test with Phantom extension enabled/disabled

## Testing

**With Phantom extension enabled**:
- App should load without errors
- Backend wallet should work
- No JSON parsing errors in console

**Without Phantom extension**:
- App should load normally
- Backend wallet should work
- External wallet option hidden

## Resources

- [Solana Wallet Adapter Docs](https://github.com/anza-xyz/wallet-adapter)
- [Convex Auth](https://docs.convex.dev/auth)
- [Web3.js](https://solana-labs.github.io/solana-web3.js/)
