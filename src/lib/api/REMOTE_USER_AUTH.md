# Remote User Authentication Guide

This guide explains how to use remote user authentication with Paperless-ngx.

## Overview

Remote user authentication allows Paperless to authenticate users via HTTP headers set by a reverse proxy or SSO system. This is useful for integrating Paperless with external authentication systems like:

- Single Sign-On (SSO) solutions
- LDAP/Active Directory
- OAuth providers
- Custom authentication systems

## Security Warning ⚠️

**CRITICAL:** The `Remote-User` header should **NEVER** be set by the client directly. It must be set by a trusted reverse proxy (nginx, Apache, Traefik, etc.) that validates the user's identity through SSO or other trusted mechanisms.

Allowing clients to set this header would be a **serious security vulnerability** that would allow anyone to impersonate any user.

## Backend Configuration

First, enable remote user authentication on your Paperless backend:

### Environment Variables

```bash
# Enable remote user authentication for the API
PAPERLESS_ENABLE_HTTP_REMOTE_USER_API=true

# Optional: Customize the header name (default: HTTP_REMOTE_USER)
PAPERLESS_HTTP_REMOTE_USER_HEADER_NAME=HTTP_REMOTE_USER
```

### Reverse Proxy Configuration

Configure your reverse proxy to set the `Remote-User` header based on your SSO system:

#### Nginx Example

```nginx
location /api/ {
    proxy_pass http://paperless-backend;
    proxy_set_header Remote-User $remote_user;  # From auth module
    # Or from SSO:
    # proxy_set_header Remote-User $http_x_forwarded_user;
}
```

#### Apache Example

```apache
<Location /api/>
    ProxyPass http://paperless-backend/api/
    RequestHeader set Remote-User "%{REMOTE_USER}s"
</Location>
```

## Frontend Configuration

### Environment Variables

```bash
# Optional: Customize the header name (must match backend)
NEXT_PUBLIC_REMOTE_USER_HEADER_NAME=Remote-User
```

### Usage

#### Option 1: Automatic (Recommended)

If your reverse proxy sets the `Remote-User` header automatically, the API client will use it automatically. No additional code is needed.

#### Option 2: Manual Setup

If you need to set the username manually (e.g., from SSO callback):

```typescript
import { useRemoteUserAuth } from '@/lib/api/hooks/use-remote-user-auth'

function MyComponent() {
  const { setRemoteUser, isAuthenticated, testAuth } = useRemoteUserAuth()
  
  useEffect(() => {
    // Get username from SSO callback or other source
    const username = getUsernameFromSSO()
    if (username) {
      setRemoteUser(username)
      testAuth().then(valid => {
        if (valid) {
          router.push('/')
        }
      })
    }
  }, [])
}
```

## How It Works

1. **Reverse Proxy Authentication**: User authenticates with SSO/reverse proxy
2. **Header Injection**: Reverse proxy sets `Remote-User: <username>` header
3. **API Requests**: Frontend includes the header in API requests
4. **Backend Validation**: Paperless validates the header and authenticates the user

## API Client Behavior

The API client (`src/lib/api/client.ts`) automatically includes the `Remote-User` header when:
- `remote_user` is stored in localStorage
- Token authentication is not being used
- The header name is configured (default: `Remote-User`)

## Authentication Flow

```
User → Reverse Proxy (SSO) → Sets Remote-User Header → Paperless API → Authenticated
```

## Troubleshooting

### Header Not Being Sent

1. Check that `remote_user` is set in localStorage
2. Verify `NEXT_PUBLIC_REMOTE_USER_HEADER_NAME` matches backend config
3. Ensure token auth is cleared (remote user takes precedence)

### Authentication Failing

1. Verify backend has `PAPERLESS_ENABLE_HTTP_REMOTE_USER_API=true`
2. Check reverse proxy is setting the header correctly
3. Verify header name matches on both frontend and backend
4. Check browser DevTools Network tab to see if header is being sent

### CORS Issues

Ensure your reverse proxy includes CORS headers:

```nginx
add_header Access-Control-Allow-Origin *;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
add_header Access-Control-Allow-Headers "Remote-User, Authorization, Content-Type";
```

## Example: SSO Integration

```typescript
// After SSO callback
function handleSSOCallback(ssoResponse: SSOResponse) {
  const { username } = ssoResponse
  
  // Store username for remote user auth
  localStorage.setItem('remote_user', username)
  
  // Test authentication
  const { testAuth } = useRemoteUserAuth()
  testAuth().then(valid => {
    if (valid) {
      router.push('/dashboard')
    }
  })
}
```

## References

- [Paperless-ngx Configuration Docs](https://docs.paperless-ngx.com/configuration/)
- [Django Remote User Authentication](https://docs.djangoproject.com/en/4.1/howto/auth-remote-user/)


