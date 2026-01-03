# How to Connect MongoDB Compass to Your HRM System Database

## Prerequisites

1. **MongoDB Server** must be running on your machine
2. **MongoDB Compass** installed (download from: https://www.mongodb.com/try/download/compass)

## Connection Steps

### Step 1: Open MongoDB Compass

Launch MongoDB Compass application on your computer.

### Step 2: Enter Connection String

In the connection screen, you have two options:

#### Option A: Use Connection String (Recommended)

1. Click on "Fill in connection fields individually" or paste the connection string directly
2. Enter the following connection string:

```
mongodb://localhost:27017/hrm-system
```

Or for the default connection (without database name):
```
mongodb://localhost:27017
```

#### Option B: Fill Fields Individually

1. **Hostname**: `localhost`
2. **Port**: `27017`
3. **Authentication**: Leave as "None" (if no authentication is set up)
4. **Authentication Database**: Leave empty
5. **Replica Set Name**: Leave empty
6. **Read Preference**: Leave as default
7. **SSL/TLS**: Unchecked (for local development)

### Step 3: Connect

Click the **"Connect"** button.

### Step 4: Select Database

After connecting, you'll see a list of databases. Select or create:
- **Database Name**: `hrm-system`

## Your Database Collections

Once connected, you should see these collections:

1. **companies** - Company information
2. **users** - Employee and admin users
3. **attendances** - Check-in/check-out records
4. **leaves** - Leave requests

## Troubleshooting

### If connection fails:

1. **Check if MongoDB is running:**
   ```bash
   # On Windows (PowerShell)
   Get-Service MongoDB
   
   # Or check if MongoDB process is running
   Get-Process mongod
   ```

2. **Start MongoDB service (if not running):**
   ```bash
   # On Windows (as Administrator)
   Start-Service MongoDB
   ```

3. **Check MongoDB default port:**
   - Default port is `27017`
   - If you changed it, update the connection string

4. **Try connecting without database name:**
   ```
   mongodb://localhost:27017
   ```
   Then manually select/create the `hrm-system` database in Compass

### Connection String Formats

**Local MongoDB (default):**
```
mongodb://localhost:27017/hrm-system
```

**With Authentication:**
```
mongodb://username:password@localhost:27017/hrm-system
```

**MongoDB Atlas (Cloud):**
```
mongodb+srv://username:password@cluster.mongodb.net/hrm-system
```

## Quick Test

After connecting, you can:
1. Browse your collections
2. View documents
3. Run queries
4. Create indexes
5. Monitor database performance

## Next Steps

Once connected, you can:
- View the seeded data (admin user: DAYFHA20241001, employee: DAYFJD20241002)
- Monitor database operations
- Debug queries
- Manage your HRM system data visually

