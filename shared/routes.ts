import { z } from 'zod';
import { insertUserSchema, insertCompanySchema, insertAttendanceSchema, insertLeaveSchema } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({ loginId: z.string(), password: z.string() }),
      responses: {
        200: z.any(), // Returns user object
        401: errorSchemas.validation,
      }
    },
    register: { // Company registration
      method: 'POST' as const,
      path: '/api/auth/register',
      input: z.object({
        companyName: z.string(),
        adminName: z.string(),
        email: z.string(),
        phone: z.string(),
        password: z.string(),
      }),
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: { 200: z.void() }
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: { 200: z.any() } // Returns user or 401
    }
  },
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: { 200: z.array(z.any()) }
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: { 200: z.any(), 404: errorSchemas.notFound }
    },
    create: { // Admin creating employee
      method: 'POST' as const,
      path: '/api/users',
      input: insertUserSchema.pick({
        firstName: true, lastName: true, email: true, phone: true,
        jobPosition: true, department: true, location: true, joiningDate: true,
        monthlyWage: true
      }),
      responses: { 201: z.any() }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/users/:id',
      input: insertUserSchema.partial(),
      responses: { 200: z.any() }
    }
  },
  attendance: {
    checkIn: {
      method: 'POST' as const,
      path: '/api/attendance/check-in',
      responses: { 200: z.any() }
    },
    checkOut: {
      method: 'POST' as const,
      path: '/api/attendance/check-out',
      responses: { 200: z.any() }
    },
    list: {
      method: 'GET' as const,
      path: '/api/attendance',
      input: z.object({
        userId: z.string().optional(),
        date: z.string().optional(),
        month: z.string().optional(),
      }).optional(),
      responses: { 200: z.array(z.any()) }
    }
  },
  leaves: {
    list: {
      method: 'GET' as const,
      path: '/api/leaves',
      responses: { 200: z.array(z.any()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/leaves',
      input: insertLeaveSchema.pick({
        type: true, startDate: true, endDate: true, reason: true, attachmentUrl: true
      }),
      responses: { 201: z.any() }
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/leaves/:id/status',
      input: z.object({ status: z.enum(['approved', 'rejected']) }),
      responses: { 200: z.any() }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}
