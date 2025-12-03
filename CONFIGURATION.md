# Configuration Guide

This guide explains how to configure the Paperless backend instance URL and other settings.

## Environment Variables

The application uses Next.js environment variables for configuration. All public variables must be prefixed with `NEXT_PUBLIC_` to be available in the browser.

### Quick Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your settings:**
   ```bash
   # For local development
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/
   
   # For remote server
   NEXT_PUBLIC_API_BASE_URL=https://paperless.example.com/api/
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

## Configuration Options

### `NEXT_PUBLIC_API_BASE_URL`

The base URL of your Paperless backend API.

- **Default:** `http://localhost:8000/api/`
- **Format:** Must include the protocol (`http://` or `https://`), host, and `/api/` path
- **Examples:**
  - Local: `http://localhost:8000/api/`
  - Remote: `https://paperless.example.com/api/`
  - Custom port: `http://localhost:9000/api/`

### `NEXT_PUBLIC_API_VERSION`

The API version your Paperless backend uses.

- **Default:** `9`
- **Note:** Should match your Paperless backend version

### `NEXT_PUBLIC_APP_TITLE`

The title displayed in the browser tab and application header.

- **Default:** `Paperless-ngx`
- **Example:** `My Paperless Instance`

### `NEXT_PUBLIC_APP_VERSION`

Application version string (for display purposes).

- **Default:** `DEVELOPMENT`
- **Example:** `1.0.0`

## Environment Files

Next.js supports multiple environment files with different priorities:

1. **`.env.local`** - Local overrides (gitignored, highest priority)
2. **`.env.development`** - Development defaults
3. **`.env.production`** - Production defaults
4. **`.env`** - Default values (lowest priority)

**Important:** Never commit `.env.local` to version control as it may contain sensitive information.

## Production Deployment

For production deployments, set environment variables in your hosting platform:

### Vercel
```bash
vercel env add NEXT_PUBLIC_API_BASE_URL
```

### Docker
```dockerfile
ENV NEXT_PUBLIC_API_BASE_URL=https://paperless.example.com/api/
```

### Kubernetes
```yaml
env:
  - name: NEXT_PUBLIC_API_BASE_URL
    value: "https://paperless.example.com/api/"
```

## Configuration File Location

The environment configuration is defined in:
- **File:** `src/environments/environment.ts`
- **Used by:** `src/lib/api/client.ts`

## Troubleshooting

### CORS Issues

If you're connecting to a remote Paperless instance, ensure CORS is configured on the backend:

```python
# In your Paperless Django settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Your Next.js dev server
    "https://your-frontend-domain.com",  # Your production frontend
]
```

### Connection Refused

- Verify the backend URL is correct
- Ensure the backend server is running
- Check firewall/network settings
- Verify the API path includes `/api/`

### Authentication Issues

- Ensure you're using the correct authentication method (Token vs Session)
- Check that the backend allows token authentication
- Verify CORS headers include credentials if using session auth

## Example Configurations

### Local Development
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/
NEXT_PUBLIC_API_VERSION=9
NEXT_PUBLIC_APP_TITLE=Paperless-ngx (Local)
```

### Remote Development Server
```env
NEXT_PUBLIC_API_BASE_URL=https://dev.paperless.example.com/api/
NEXT_PUBLIC_API_VERSION=9
NEXT_PUBLIC_APP_TITLE=Paperless-ngx (Dev)
```

### Production
```env
NEXT_PUBLIC_API_BASE_URL=https://paperless.example.com/api/
NEXT_PUBLIC_API_VERSION=9
NEXT_PUBLIC_APP_TITLE=Paperless-ngx
NEXT_PUBLIC_APP_VERSION=1.0.0
```

