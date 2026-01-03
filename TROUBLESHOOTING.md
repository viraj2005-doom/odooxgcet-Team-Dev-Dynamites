# Troubleshooting Guide

## Common Errors and Solutions

### 1. NODE_ENV Error (Windows)

**Error:**
```
'NODE_ENV' is not recognized as an internal or external command
```

**Solution:** ✅ Fixed!
- Added `cross-env` package to handle environment variables cross-platform
- Scripts now work on Windows, macOS, and Linux

### 2. MongoDB Connection Error

**Error:**
```
MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**

#### Check if MongoDB is Running:
```powershell
# Windows PowerShell
Get-Service MongoDB
```

#### Start MongoDB Service:
```powershell
# Windows (Run as Administrator)
Start-Service MongoDB

# Or start MongoDB manually
mongod
```

#### Verify MongoDB Connection:
```powershell
# Test connection
mongosh mongodb://localhost:27017
```

#### Check .env File:
Make sure your `.env` file contains:
```
MONGODB_URI=mongodb://localhost:27017/hrm-system
```

### 3. Missing Environment Variables

**Error:**
```
MONGODB_URI must be set in your .env file
```

**Solution:**
1. Create a `.env` file in the root directory
2. Add the MongoDB connection string:
   ```
   MONGODB_URI=mongodb://localhost:27017/hrm-system
   PORT=5000
   NODE_ENV=development
   SESSION_SECRET=dev_secret_change_in_production
   ```

### 4. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
1. Change the PORT in `.env` file to a different port (e.g., 5001)
2. Or stop the process using port 5000:
   ```powershell
   # Find process using port 5000
   netstat -ano | findstr :5000
   
   # Kill the process (replace PID with actual process ID)
   taskkill /PID <PID> /F
   ```

### 5. Module Not Found Errors

**Error:**
```
Cannot find module 'mongoose'
```

**Solution:**
```bash
npm install
```

This will install all dependencies including:
- mongoose
- cross-env
- dotenv
- express
- and others

### 6. TypeScript Errors

**Error:**
```
'tsc' is not recognized
```

**Solution:**
```bash
npm install
```

TypeScript is included in devDependencies and will be installed.

## Quick Start Checklist

- [ ] MongoDB is installed and running
- [ ] `.env` file exists with `MONGODB_URI` set
- [ ] Dependencies installed: `npm install`
- [ ] MongoDB service is running: `Get-Service MongoDB`
- [ ] Server starts: `npm run dev`

## Testing the Setup

1. **Test MongoDB Connection:**
   ```powershell
   mongosh mongodb://localhost:27017
   ```

2. **Test Server:**
   ```powershell
   npm run dev
   ```

3. **Expected Output:**
   ```
   ✓ Connected to MongoDB
     Database: hrm-system
     Host: localhost:27017
   serving on port 5000
   ```

## Getting Help

If you encounter other errors:
1. Check the error message carefully
2. Verify MongoDB is running
3. Check your `.env` file
4. Make sure all dependencies are installed: `npm install`
5. Review the console output for specific error messages

