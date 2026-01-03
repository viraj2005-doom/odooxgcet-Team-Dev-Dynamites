# MongoDB Backend Setup

The HRM System backend has been migrated from PostgreSQL/Drizzle to MongoDB with Mongoose.

## Environment Variables

Set the following environment variable:

```bash
MONGODB_URI=mongodb://localhost:27017/hrm-system
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hrm-system
```

## Installation

Install dependencies:

```bash
npm install
```

## Database Connection

The MongoDB connection is established automatically when the server starts. The connection is handled in `server/db.ts` and initialized in `server/routes.ts`.

## Schema Models

All Mongoose models are defined in `shared/schema.ts`:
- **Company**: Company information
- **User**: Employee and admin users
- **Attendance**: Check-in/check-out records
- **Leave**: Leave requests

## Storage Layer

The storage layer (`server/storage.ts`) provides a clean interface for all database operations using MongoDB/Mongoose.

## Key Changes from PostgreSQL

1. **IDs**: Changed from numeric IDs to MongoDB ObjectIds (strings)
2. **Schemas**: Migrated from Drizzle ORM to Mongoose schemas
3. **Queries**: Updated all queries to use Mongoose methods
4. **Relations**: Using MongoDB references instead of foreign keys

## Running the Server

```bash
npm run dev
```

The server will:
1. Connect to MongoDB
2. Seed initial data (if not already present)
3. Start the Express server on port 5000 (or PORT env variable)

