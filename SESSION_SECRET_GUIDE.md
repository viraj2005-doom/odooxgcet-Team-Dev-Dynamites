# SESSION_SECRET Setup Guide

## What is SESSION_SECRET?

`SESSION_SECRET` is a cryptographic key used to sign and encrypt session cookies in your Express.js application. It's critical for security because:

- **Prevents session hijacking**: Without a secret, attackers could forge session cookies
- **Protects user sessions**: Ensures only your server can create valid sessions
- **Required for production**: Never use default/weak secrets in production

## How to Generate a Secure Secret

### Method 1: Using the Provided Script (Recommended)

```bash
npm run generate-secret
```

This will generate a cryptographically secure 128-character hexadecimal string.

### Method 2: Using Node.js Directly

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Method 3: Using OpenSSL (Linux/Mac)

```bash
openssl rand -hex 64
```

### Method 4: Using PowerShell (Windows)

```powershell
-join ((48..57) + (97..102) | Get-Random -Count 128 | % {[char]$_})
```

## Setting Up SESSION_SECRET

### For Development

You can use a simple secret for local development:

```env
SESSION_SECRET=dev_secret_change_in_production
```

**⚠️ Warning**: Never use this in production!

### For Production

1. **Generate a secure secret** using one of the methods above
2. **Add it to your `.env` file**:
   ```env
   SESSION_SECRET=your_generated_secure_secret_here_128_characters_long
   ```
3. **Never commit it to version control** (already in `.gitignore`)

## Best Practices

### ✅ DO:
- Use a long, random string (at least 64 characters)
- Generate a unique secret for each environment (dev, staging, production)
- Store secrets in environment variables, not in code
- Rotate secrets periodically (every 6-12 months)
- Use different secrets for different applications

### ❌ DON'T:
- Use simple words or phrases
- Reuse the same secret across multiple applications
- Commit secrets to Git repositories
- Share secrets in chat/email
- Use default values in production

## Example .env File

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/hrm-system

# Server Configuration
PORT=5000
NODE_ENV=development

# Session Secret (Generated securely)
SESSION_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

## Security Checklist

- [ ] Secret is at least 64 characters long
- [ ] Secret is randomly generated (not a dictionary word)
- [ ] `.env` file is in `.gitignore`
- [ ] Different secrets for dev/staging/production
- [ ] Secrets are stored securely (environment variables, not code)
- [ ] Team members know not to commit secrets

## Troubleshooting

### "Session not persisting"
- Check that `SESSION_SECRET` is set in your `.env` file
- Restart the server after changing the secret
- Clear browser cookies if testing

### "Invalid session"
- If you change the secret, all existing sessions will be invalid
- Users will need to log in again after secret rotation

## Production Deployment

For production environments (Heroku, AWS, Azure, etc.):

1. **Set environment variable** in your hosting platform's dashboard
2. **Never hardcode** the secret in your code
3. **Use platform secrets management**:
   - Heroku: `heroku config:set SESSION_SECRET=your_secret`
   - AWS: Use AWS Secrets Manager or Parameter Store
   - Azure: Use Azure Key Vault
   - Vercel/Netlify: Use environment variables in dashboard

## Quick Reference

```bash
# Generate secret
npm run generate-secret

# Or manually
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

