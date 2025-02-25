# Authentication in Future SIR

This document provides a high-level overview of the authentication mechanisms in Future SIR.
For detailed implementation, refer to the source code and configuration files.

- `~/routes/auth/*`
- `~/routes/dev/oidc-provider.tsx`
- `~/.server/auth/auth-strategies`
- `~/.server/environment/authentication`
- `~/.server/utils/auth-utils.ts`

## Overview

The project supports two authentication providers:

- **Azure Active Directory (Azure AD)**
- **A local Mock OIDC Provider** (for development purposes)

The default provider, which is used when no provider is specified during login,
is determined by the `AUTH_DEFAULT_PROVIDER` environment variable.

## Configuration

### Environment variables

The following environment variables are used to configure authentication:

- `AUTH_DEFAULT_PROVIDER`: specifies the default authentication provider. Valid values are `azuread` and `local`.
- `AZUREAD_ISSUER_URL`: the issuer URL for Azure AD.
- `AZUREAD_CLIENT_ID`: the client ID for Azure AD.
- `AZUREAD_CLIENT_SECRET`: the client secret for Azure AD.

Example configuration in `.env` file:

```env
AUTH_DEFAULT_PROVIDER=azuread

AZUREAD_ISSUER_URL=https://login.microsoftonline.com/{tenant}/v2.0
AZUREAD_CLIENT_ID=your-client-id
AZUREAD_CLIENT_SECRET=your-client-secret
```

## Authentication flow

### Azure AD authentication

1. **Login request**: the user initiates a login request by hitting `/auth/login/azuread`.
2. **Authorization endpoint**: the request is redirected to the Azure AD authorization endpoint.
3. **Token exchange**: after successful authentication, Azure AD redirects back to `/auth/callback/azuread` with an authorization code; the application exchanges this code for tokens.
4. **Session management**: the tokens are stored in the session.

### Local mock OIDC provider

1. **Login request**: the user initiates a login request by hitting `/auth/login/local`.
2. **Authorization endpoint**: the request is redirected to the local mock OIDC provider listening on `/auth/oidc/*`.
3. **Token exchange**: after successful authentication, the local mock OIDC provider redirects back to `/auth/callback/local` with an authorization code; the application exchanges this code for tokens.
4. **Session management**: the tokens are stored in the session.

## Key components

### Authentication strategies<br>(`~/.server/auth/auth-strategies.ts`)

The project defines two authentication strategies:

- `AzureADAuthenticationStrategy`: handles authentication with Azure AD.
- `LocalAuthenticationStrategy`: handles authentication with the local mock OIDC provider.

### Session management<br>(`~/@types/express-session.d.ts`)

The authentication session state includes:

- `authState`: contains the access token, ID token, and ID token claims. When this is defined, the user is considered authenticated.
- `loginState`: stores the login state during the authentication process. This is used during the login flow and then removed upon successful login.

### Utility functions<br>(`~/.server/utils/auth-utils.ts`)

- `requireAuth()`: ensures that the user is authenticated and has the required roles.
- `hasRole()`: checks if the user session contains the specified role.

## Error handling<br>(`~/errors/error-codes.ts`)

The project defines custom error codes and messages for various authentication-related errors, such as missing configuration or invalid tokens.
