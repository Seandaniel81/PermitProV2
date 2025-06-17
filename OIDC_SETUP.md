# OpenID Connect Provider Setup Guide

This guide explains how to configure various OpenID Connect providers for authentication with the Permit Management System.

## Supported Providers

- Google OAuth 2.0
- Microsoft Azure AD
- Auth0
- Keycloak
- Any OpenID Connect compliant provider

## Google OAuth 2.0 Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" > "Credentials"

### 2. Configure OAuth Consent Screen

1. Click "OAuth consent screen"
2. Choose "External" for public applications
3. Fill in required fields:
   - App name: "Permit Management System"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `openid`, `email`, `profile`
5. Save and continue

### 3. Create OAuth 2.0 Client

1. Click "Create Credentials" > "OAuth 2.0 Client IDs"
2. Application type: "Web application"
3. Name: "Permit Management System"
4. Authorized redirect URIs:
   - `http://localhost:5000/api/callback` (for development)
   - `https://yourdomain.com/api/callback` (for production)
5. Click "Create"
6. Copy the Client ID and Client Secret

### 4. Environment Configuration

```bash
OIDC_ISSUER_URL=https://accounts.google.com
OIDC_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
OIDC_CLIENT_SECRET=your-google-client-secret
ALLOWED_DOMAINS=localhost,yourdomain.com
```

## Microsoft Azure AD Setup

### 1. Register Application

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Name: "Permit Management System"
5. Supported account types: Choose appropriate option
6. Redirect URI: `https://yourdomain.com/api/callback`
7. Click "Register"

### 2. Configure Authentication

1. Go to "Authentication" in your app
2. Add redirect URIs:
   - `http://localhost:5000/api/callback`
   - `https://yourdomain.com/api/callback`
3. Enable "ID tokens" under "Implicit grant and hybrid flows"
4. Save changes

### 3. Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Add description and expiration
4. Copy the secret value immediately

### 4. Environment Configuration

```bash
OIDC_ISSUER_URL=https://login.microsoftonline.com/{tenant-id}/v2.0
OIDC_CLIENT_ID=your-azure-application-id
OIDC_CLIENT_SECRET=your-azure-client-secret
ALLOWED_DOMAINS=localhost,yourdomain.com
```

## Auth0 Setup

### 1. Create Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to "Applications"
3. Click "Create Application"
4. Name: "Permit Management System"
5. Type: "Regular Web Applications"
6. Click "Create"

### 2. Configure Application

1. Go to "Settings" tab
2. Add Allowed Callback URLs:
   - `http://localhost:5000/api/callback`
   - `https://yourdomain.com/api/callback`
3. Add Allowed Logout URLs:
   - `http://localhost:5000`
   - `https://yourdomain.com`
4. Save changes

### 3. Environment Configuration

```bash
OIDC_ISSUER_URL=https://your-auth0-domain.auth0.com/
OIDC_CLIENT_ID=your-auth0-client-id
OIDC_CLIENT_SECRET=your-auth0-client-secret
ALLOWED_DOMAINS=localhost,yourdomain.com
```

## Keycloak Setup

### 1. Create Realm (if needed)

1. Access Keycloak Admin Console
2. Create new realm or use existing one
3. Note the realm name

### 2. Create Client

1. Go to "Clients" in your realm
2. Click "Create"
3. Client ID: "permit-management-system"
4. Client Protocol: "openid-connect"
5. Root URL: `https://yourdomain.com`
6. Save

### 3. Configure Client

1. Set Access Type: "confidential"
2. Add Valid Redirect URIs:
   - `http://localhost:5000/api/callback`
   - `https://yourdomain.com/api/callback`
3. Save and go to "Credentials" tab
4. Copy the client secret

### 4. Environment Configuration

```bash
OIDC_ISSUER_URL=https://your-keycloak-domain/auth/realms/your-realm
OIDC_CLIENT_ID=permit-management-system
OIDC_CLIENT_SECRET=your-keycloak-client-secret
ALLOWED_DOMAINS=localhost,yourdomain.com
```

## Generic OpenID Connect Provider

For any OpenID Connect compliant provider:

### 1. Find Provider Information

Most providers publish their configuration at:
`https://provider-domain/.well-known/openid_configuration`

### 2. Register Application

1. Create application in provider's dashboard
2. Set application type to "Web Application"
3. Add redirect URIs: `https://yourdomain.com/api/callback`
4. Note client ID and secret

### 3. Environment Configuration

```bash
OIDC_ISSUER_URL=https://provider-issuer-url
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
ALLOWED_DOMAINS=localhost,yourdomain.com
```

## Configuration Options

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OIDC_ISSUER_URL` | OpenID Connect issuer URL | `https://accounts.google.com` |
| `OIDC_CLIENT_ID` | OAuth 2.0 client identifier | `123456.apps.googleusercontent.com` |
| `OIDC_CLIENT_SECRET` | OAuth 2.0 client secret | `your-secret-key` |
| `ALLOWED_DOMAINS` | Comma-separated list of allowed domains | `localhost,app.example.com` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTO_APPROVE_USERS` | Automatically approve new users | `false` |
| `LOGOUT_REDIRECT_URL` | URL to redirect after logout | Home page |

## Testing Your Setup

### 1. Update Configuration

Edit your `.env` file with the obtained credentials:

```bash
# Copy from your provider setup
OIDC_ISSUER_URL=https://accounts.google.com
OIDC_CLIENT_ID=your-actual-client-id
OIDC_CLIENT_SECRET=your-actual-client-secret
ALLOWED_DOMAINS=localhost
```

### 2. Restart Application

```bash
npm run build
npm start
```

### 3. Test Authentication

1. Navigate to `http://localhost:5000`
2. Click login button
3. You should be redirected to your OpenID Connect provider
4. After successful authentication, you'll be redirected back

## Troubleshooting

### Common Issues

1. **Invalid redirect URI**
   - Ensure redirect URIs match exactly in provider configuration
   - Include both HTTP (development) and HTTPS (production) URLs

2. **Invalid client credentials**
   - Verify client ID and secret are correct
   - Check for extra spaces or characters

3. **CORS errors**
   - Ensure `ALLOWED_DOMAINS` includes your current domain
   - Check provider CORS settings

4. **User approval required**
   - Set `AUTO_APPROVE_USERS=true` for automatic approval
   - Or manually approve users in admin interface

### Debug Steps

1. Check application logs for detailed error messages
2. Verify provider's `.well-known/openid_configuration` endpoint
3. Test OAuth flow using provider's debug tools
4. Ensure all required scopes are configured

## Security Considerations

1. **Use HTTPS in production** - Never use HTTP for production deployments
2. **Secure client secrets** - Store secrets securely, never commit to version control
3. **Validate domains** - Only allow trusted domains in `ALLOWED_DOMAINS`
4. **Regular rotation** - Rotate client secrets periodically
5. **Monitor access** - Review authentication logs regularly

## Production Deployment

### SSL Certificate Requirements

OpenID Connect requires HTTPS in production. Ensure you have:

1. Valid SSL certificate for your domain
2. Proper redirect URI configuration with HTTPS
3. Updated `ALLOWED_DOMAINS` with production domain

### Provider-Specific Notes

- **Google**: Requires domain verification for production use
- **Microsoft**: May require tenant admin consent for certain scopes
- **Auth0**: Check rate limits for your plan
- **Keycloak**: Ensure proper realm and client configuration