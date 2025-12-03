# Paperless Link

A modern React/Next.js frontend for Paperless-ngx, built with Subframe components.


PaperlessLink is a modern, open-source frontend application designed to provide a React/Next.js-based user interface for Paperless-ngx, a document management system. The project leverages Subframe UI components and is built with TypeScript, offering developers a clean, component-driven architecture. It includes pre-configured environment setup, API client services ported from Angular, and supports authentication including SSO through Remote User Auth.


### Main Function Points
- Modern React/Next.js frontend for Paperless-ngx document management system
- Authentication system with username/password and SSO support (Remote User Auth)
- RESTful API integration with configurable backend URLs
- Component-based UI architecture using Subframe design system
- Development environment with hot-reload capabilities
- Comprehensive configuration and documentation support
- API client services previously migrated from Angular implementation

### Technology Stack
- **Frontend Framework**: React, Next.js (App Router)
- **Language**: TypeScript (98.8% of codebase)
- **UI Components**: Subframe
- **Package Manager**: pnpm
- **Development Tools**: ESLint, PostCSS
- **Build Tools**: Next.js build system

### License
No license information is provided in the repository documentation.



## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy the example environment file and configure your Paperless backend:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your backend URL:

```bash
NEXT_PUBLIC_API_BASE_URL=https://paperless.terra-net.io/api/
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Sign In

Navigate to `/signin` and enter your Paperless username and password.

## Configuration

See [CONFIGURATION.md](./CONFIGURATION.md) for detailed configuration options.

## Project Structure

- `src/app/` - Next.js app router pages
- `src/ui/` - Subframe UI components
- `src/lib/api/` - API client and services (ported from Angular)
- `src/environments/` - Environment configuration

## Documentation

- [Configuration Guide](./CONFIGURATION.md) - Environment variables and setup
- [API Migration Guide](./src/lib/api/MIGRATION_GUIDE.md) - Angular to React service migration
- [Remote User Auth](./src/lib/api/REMOTE_USER_AUTH.md) - SSO authentication setup

## Learn More

- [Subframe documentation](https://docs.subframe.com/introduction)
- [Next.js documentation](https://nextjs.org/docs)
