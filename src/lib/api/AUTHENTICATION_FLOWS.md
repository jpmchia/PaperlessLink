# Authentication Flows Explained

This document explains the different authentication methods available and how they work.

## Two Authentication Methods

### 1. Token Authentication (Current Sign-In Page)

**How it works:**
1. User enters username/password on sign-in page
2. Frontend calls `/api/token/` with credentials
3. Backend validates credentials and returns a token
4. Frontend stores token in localStorage
5. All subsequent API requests include `Authorization: Token <token>` header

**Flow:**
```
User → Sign-In Page → POST /api/token/ → Receive Token → Store Token → Authenticated
```

**Pros:**
- Standard REST API authentication
- Works with direct API access
- No reverse proxy required
- Simple to implement

**Cons:**
- Requires username/password
- Token must be stored securely
- No SSO integration

### 2. Remote User Authentication (SSO/Reverse Proxy)

**How it works:**
1. User authenticates with SSO/reverse proxy (NOT on sign-in page)
2. Reverse proxy validates credentials and sets `Remote-User: <username>` header
3. Frontend stores username in localStorage (optional, for client-side reference)
4. All API requests include `Remote-User: <username>` header
5. Backend reads header and authenticates user

**Flow:**
```
User → SSO/Reverse Proxy → Authenticated → Sets Remote-User Header → API Requests → Authenticated
```

**Important:** Remote user auth does NOT use tokens. It uses HTTP headers set by the reverse proxy.

**Pros:**
- SSO integration
- No password storage in frontend
- Centralized authentication
- Works with LDAP/AD

**Cons:**
- Requires reverse proxy configuration
- More complex setup
- Security depends on proxy configuration

## How They Work Together

The API client (`src/lib/api/client.ts`) supports both methods:

1. **Token auth takes precedence**: If a token exists, it's used
2. **Remote user as fallback**: If no token, remote user header is used
3. **Mutually exclusive**: Only one method is used at a time

## Sign-In Page Behavior

### Current Implementation (Token Auth Only)

The current sign-in page uses token authentication:
- User enters username/password
- Calls `/api/token/` endpoint
- Receives and stores token
- Redirects to dashboard

### With Remote User Auth

If using remote user authentication, you typically **wouldn't use the sign-in page** because:
- Authentication happens at the reverse proxy level
- User is redirected to SSO login
- After SSO, user is automatically authenticated

However, you could modify the sign-in page to:
1. Detect if remote user auth is enabled
2. Redirect to SSO if enabled
3. Or provide a hybrid approach

## Example: Hybrid Sign-In Page

```typescript
// Check if remote user auth should be used
const useRemoteUserAuth = process.env.NEXT_PUBLIC_USE_REMOTE_USER_AUTH === 'true'

if (useRemoteUserAuth) {
  // Redirect to SSO or use remote user flow
  router.push('/sso-login')
} else {
  // Use token authentication
  await login({ username, password })
}
```

## Which Method to Use?

**Use Token Auth when:**
- Direct API access needed
- No SSO infrastructure
- Simple deployment
- Standard username/password login

**Use Remote User Auth when:**
- SSO integration required
- LDAP/AD authentication
- Centralized user management
- Reverse proxy already configured
- Security through proxy headers

## Security Considerations

### Token Auth
- Store tokens securely (localStorage is acceptable for SPAs)
- Use HTTPS always
- Implement token refresh if needed

### Remote User Auth
- **CRITICAL**: Reverse proxy MUST validate users
- Never allow clients to set Remote-User header directly
- Ensure proxy strips external Remote-User headers
- Use HTTPS and secure proxy configuration


