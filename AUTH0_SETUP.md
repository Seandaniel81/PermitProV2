# Auth0 Production Setup Guide

This guide covers setting up Auth0 authentication for both online server and private computer deployments.

## Auth0 Application Setup

### 1. Create Auth0 Account
1. Go to [Auth0.com](https://auth0.com) and create an account
2. Create a new tenant (e.g., `yourcompany-permits`)

### 2. Create Application
1. Go to Applications → Create Application
2. Choose "Regular Web Application"
3. Select Node.js as the technology

### 3. Configure Application Settings

#### For Online Server Deployment:
```
Name: Permit Management System (Production)
Allowed Callback URLs: 
  https://yourdomain.com/callback
  https://www.yourdomain.com/callback

Allowed Logout URLs:
  https://yourdomain.com
  https://www.yourdomain.com

Allowed Web Origins:
  https://yourdomain.com
  https://www.yourdomain.com

Allowed Origins (CORS):
  https://yourdomain.com
  https://www.yourdomain.com
```

#### For Private Computer Deployment:
```
Name: Permit Management System (Private)
Allowed Callback URLs: 
  http://localhost:3000/callback
  http://127.0.0.1:3000/callback

Allowed Logout URLs:
  http://localhost:3000
  http://127.0.0.1:3000

Allowed Web Origins:
  http://localhost:3000
  http://127.0.0.1:3000

Allowed Origins (CORS):
  http://localhost:3000
  http://127.0.0.1:3000
```

### 4. Get Credentials
Copy these values from your Auth0 application:
- Domain
- Client ID
- Client Secret

## Environment Configuration

### Online Server (.env.production)
```bash
USE_AUTH0=true
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id_here
AUTH0_CLIENT_SECRET=your_client_secret_here
AUTH0_CALLBACK_URL=https://yourdomain.com/callback
AUTH0_LOGOUT_URL=https://yourdomain.com
```

### Private Computer (.env)
```bash
USE_AUTH0=true
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id_here
AUTH0_CLIENT_SECRET=your_client_secret_here
AUTH0_CALLBACK_URL=http://localhost:3000/callback
AUTH0_LOGOUT_URL=http://localhost:3000
```

## User Management in Auth0

### 1. Configure User Registration
1. Go to Authentication → Database
2. Configure Username-Password-Authentication
3. Set signup settings:
   - Enable signup
   - Require email verification (recommended)

### 2. Set Up User Roles
1. Go to User Management → Roles
2. Create roles:
   - `admin` - Full system access
   - `user` - Standard user access
   - `contractor` - Contractor-specific access

### 3. Configure Rules/Actions
Create a rule to assign default roles:

```javascript
function assignUserRole(user, context, callback) {
  const assignedRoles = context.authorization.roles || [];
  
  // Assign default role if no roles assigned
  if (assignedRoles.length === 0) {
    const defaultRole = 'user';
    user.app_metadata = user.app_metadata || {};
    user.app_metadata.role = defaultRole;
    
    auth0.users.updateAppMetadata(user.user_id, user.app_metadata)
      .then(() => {
        context.idToken['https://permitapp.com/role'] = defaultRole;
        callback(null, user, context);
      })
      .catch(callback);
  } else {
    const primaryRole = assignedRoles[0];
    context.idToken['https://permitapp.com/role'] = primaryRole;
    callback(null, user, context);
  }
}
```

## Security Configuration

### 1. Enable MFA (Recommended)
1. Go to Security → Multi-factor Auth
2. Enable for all users or specific conditions
3. Choose factors: SMS, Email, Authenticator apps

### 2. Configure Branding
1. Go to Branding → Universal Login
2. Customize login page with your company branding
3. Upload logo and set colors

### 3. Set Up Social Connections (Optional)
1. Go to Authentication → Social
2. Enable desired providers (Google, Microsoft, etc.)
3. Configure with your OAuth apps

## Deployment-Specific Instructions

### Online Server with Auth0
```bash
# Set environment variables
export USE_AUTH0=true
export AUTH0_DOMAIN=your-tenant.auth0.com
export AUTH0_CLIENT_ID=your_client_id
export AUTH0_CLIENT_SECRET=your_client_secret
export AUTH0_CALLBACK_URL=https://yourdomain.com/callback

# Deploy with Docker
docker-compose --profile production up -d
```

### Private Computer with Auth0
```bash
# Set in .env file
USE_AUTH0=true
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_CALLBACK_URL=http://localhost:3000/callback

# Start application
npm start
```

## Testing Auth0 Integration

### 1. Test Login Flow
1. Visit your application URL
2. Click login - should redirect to Auth0
3. Create test account or login
4. Should redirect back to dashboard

### 2. Test User Roles
1. Login as different user types
2. Verify appropriate access levels
3. Test admin-only sections

### 3. Test Logout
1. Click logout
2. Should redirect to Auth0 logout
3. Should return to landing page

## Troubleshooting

### Common Issues
1. **Callback URL mismatch**: Ensure exact URL match in Auth0 settings
2. **CORS errors**: Add your domain to Allowed Origins
3. **SSL issues**: Use HTTPS in production, HTTP for local development
4. **Role assignment**: Check Auth0 rules/actions are properly configured

### Debug Mode
Set `DEBUG=auth0:*` environment variable for detailed Auth0 logs.