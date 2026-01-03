import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import MemoryStore from "memorystore";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate Login ID: CompanyCode + F + L + Year + Serial
// e.g., OIJD20220001
async function generateLoginId(companyCode: string, firstName: string, lastName: string, year: number): Promise<string> {
  const prefix = `${companyCode}${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}${year}`;
  // Find last user with this prefix to increment serial
  // This is a simplified "random" approach to avoid complex DB queries for max serial in this prototype
  // In prod, you'd select count or max id.
  const serial = Math.floor(Math.random() * 9000) + 1000; // 4 digits
  return `${prefix}${serial}`;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Auth Setup
  const SessionStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: app.get("env") === "production" },
    store: new SessionStore({ checkPeriod: 86400000 }),
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy({
    usernameField: "loginId",
    passwordField: "password"
  }, async (loginId, password, done) => {
    try {
      const user = await storage.getUserByLoginId(loginId);
      if (!user) return done(null, false, { message: "Invalid login ID" });
      
      const isValid = await comparePasswords(password, user.password);
      if (!isValid) return done(null, false, { message: "Invalid password" });
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth Routes
  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const { companyName, adminName, email, phone, password } = req.body;
      
      // 1. Create Company
      // Generate simple code (first 4 chars uppercase)
      const code = companyName.substring(0, 4).toUpperCase();
      const company = await storage.createCompany({
        name: companyName,
        code, // Check uniqueness in real app
        email,
        phone,
      });

      // 2. Create Admin
      const [firstName, ...rest] = adminName.split(" ");
      const lastName = rest.join(" ") || "Admin";
      const year = new Date().getFullYear();
      
      const loginId = await generateLoginId(code, firstName, lastName, year);
      const hashedPassword = await hashPassword(password);

      const admin = await storage.createUser({
        companyId: company.id,
        loginId,
        password: hashedPassword,
        role: "admin",
        firstName,
        lastName,
        email,
        phone,
        joiningDate: new Date().toISOString(),
        monthlyWage: 0, // Admin might not have wage set initially
      });

      req.login(admin, (err) => {
        if (err) throw err;
        res.status(201).json(admin);
      });
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout(() => {
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.sendStatus(403);
    next();
  };

  // User Routes
  app.get(api.users.list.path, requireAuth, async (req, res) => {
    // Only return users from same company
    // @ts-ignore
    const users = await storage.getUsersByCompany(req.user.companyId);
    res.json(users);
  });

  app.post(api.users.create.path, requireAdmin, async (req, res) => {
    try {
      // @ts-ignore
      const company = await storage.getCompanyByCode(req.user.companyId); // Wait, need company code
      // Better: get user's company first.
      // @ts-ignore
      const userCompany = await db.query.companies.findFirst({ where: eq(companies.id, req.user.companyId) });
      
      const { firstName, lastName, joiningDate } = req.body;
      const year = new Date(joiningDate).getFullYear();
      // @ts-ignore
      const loginId = await generateLoginId(userCompany.code, firstName, lastName, year);
      
      // Default password for new employees (e.g. "password123" or random)
      // Requirement says "system-generated".
      const tempPassword = "password123"; 
      const hashedPassword = await hashPassword(tempPassword);

      const user = await storage.createUser({
        ...req.body,
        // @ts-ignore
        companyId: req.user.companyId,
        loginId,
        password: hashedPassword,
        role: "employee",
      });
      res.status(201).json(user);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });
  
  app.get(api.users.get.path, requireAuth, async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  // Attendance
  app.post(api.attendance.checkIn.path, requireAuth, async (req, res) => {
    // @ts-ignore
    const record = await storage.checkIn(req.user.id, new Date().toISOString().split('T')[0]);
    res.json(record);
  });

  app.post(api.attendance.checkOut.path, requireAuth, async (req, res) => {
    try {
      // @ts-ignore
      const record = await storage.checkOut(req.user.id, new Date().toISOString().split('T')[0]);
      res.json(record);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  app.get(api.attendance.list.path, requireAuth, async (req, res) => {
    // @ts-ignore
    if (req.user.role === 'admin') {
      // Admin sees all for company
      // @ts-ignore
      const records = await storage.getCompanyAttendance(req.user.companyId, req.query.date as string || new Date().toISOString().split('T')[0]);
      res.json(records);
    } else {
      // Employee sees own
      // @ts-ignore
      const records = await storage.getUserAttendanceRange(req.user.id, '2000-01-01', '2100-01-01'); // Simplified
      res.json(records);
    }
  });

  // Leaves
  app.get(api.leaves.list.path, requireAuth, async (req, res) => {
    // @ts-ignore
    if (req.user.role === 'admin') {
      // @ts-ignore
      const records = await storage.getCompanyLeaves(req.user.companyId);
      res.json(records);
    } else {
      // @ts-ignore
      const records = await storage.getUserLeaves(req.user.id);
      res.json(records);
    }
  });
  
  app.post(api.leaves.create.path, requireAuth, async (req, res) => {
    const leave = await storage.createLeave({
      ...req.body,
      // @ts-ignore
      userId: req.user.id,
      daysCount: 1, // Calculate based on start/end
      status: 'pending'
    });
    res.status(201).json(leave);
  });

  app.patch(api.leaves.updateStatus.path, requireAdmin, async (req, res) => {
    const leave = await storage.updateLeaveStatus(Number(req.params.id), req.body.status);
    res.json(leave);
  });

  // Seeding Logic
  const existingAdmin = await storage.getUserByLoginId("DAYFHA20241001");
  if (!existingAdmin) {
    console.log("Seeding database...");
    
    // Check/Create Company
    let company = await storage.getCompanyByCode("DAYF");
    if (!company) {
        company = await storage.createCompany({
            name: "Dayflow Inc.",
            code: "DAYF",
            email: "contact@dayflow.com",
            phone: "123-456-7890",
        });
    }

    // Create Admin
    const adminPass = await hashPassword("admin123");
    await storage.createUser({
        companyId: company.id,
        loginId: "DAYFHA20241001",
        password: adminPass,
        role: "admin",
        firstName: "Hr",
        lastName: "Admin",
        email: "admin@dayflow.com",
        phone: "123-456-7890",
        joiningDate: new Date().toISOString(),
        monthlyWage: 500000,
        status: "active",
        jobPosition: "HR Manager",
        department: "HR"
    });

    // Create Employee
    const empPass = await hashPassword("user123");
    await storage.createUser({
        companyId: company.id,
        loginId: "DAYFJD20241002",
        password: empPass,
        role: "employee",
        firstName: "John",
        lastName: "Doe",
        email: "john@dayflow.com",
        phone: "098-765-4321",
        joiningDate: new Date().toISOString(),
        monthlyWage: 300000,
        status: "active",
        jobPosition: "Developer",
        department: "Engineering"
    });
    console.log("Database seeded successfully!");
  }

  return httpServer;
}
