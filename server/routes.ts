import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { connectDB } from "./db";
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
  // Connect to MongoDB
  await connectDB();
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
    usernameField: "email",
    passwordField: "password"
  }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) return done(null, false, { message: "Invalid email or password" });
      
      if (!user.emailVerified) {
        return done(null, false, { message: "Please verify your email before logging in" });
      }
      
      const isValid = await comparePasswords(password, user.password);
      if (!isValid) return done(null, false, { message: "Invalid email or password" });
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    // Handle both Mongoose documents and plain objects
    let userId: string;
    if (user._id) {
      // Mongoose document or object with _id
      userId = typeof user._id === 'string' ? user._id : user._id.toString();
    } else if (user.id) {
      userId = typeof user.id === 'string' ? user.id : user.id.toString();
    } else {
      return done(new Error("User object missing _id or id"));
    }
    done(null, userId);
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      // Convert Mongoose document to plain object
      const userObj = user.toObject ? user.toObject() : user;
      done(null, userObj);
    } catch (err) {
      done(err);
    }
  });

  // Auth Routes
  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    // Convert Mongoose document to plain object if needed
    const user = req.user && typeof req.user.toObject === 'function' 
      ? req.user.toObject() 
      : req.user;
    res.json(user);
  });

  // Password validation
  function validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters long" };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/\d/.test(password)) {
      return { valid: false, message: "Password must contain at least one number" };
    }
    if (!/[@$!%*?&]/.test(password)) {
      return { valid: false, message: "Password must contain at least one special character (@$!%*?&)" };
    }
    return { valid: true };
  }

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const { employeeId, email, password, role } = req.body;
      
      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Check if employee ID already exists
      const existingEmployee = await storage.getUserByLoginId(employeeId);
      if (existingEmployee) {
        return res.status(400).json({ message: "Employee ID already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Generate email verification token
      const verificationToken = randomBytes(32).toString('hex');
      const verificationExpires = new Date();
      verificationExpires.setHours(verificationExpires.getHours() + 24); // Valid for 24 hours

      // Create default company if needed (for standalone users)
      // Or require company selection - for now, create a default company
      let company = await storage.getCompanyByCode("DEFAULT");
      if (!company) {
        company = await storage.createCompany({
          name: "Default Company",
          code: "DEFAULT",
          email: "admin@default.com",
          phone: "000-000-0000",
        });
      }

      // Create user
      const user = await storage.createUser({
        companyId: company._id.toString(),
        loginId: employeeId,
        password: hashedPassword,
        role: role === "hr" ? "admin" : "employee", // Map hr to admin role
        firstName: "", // Will be filled in profile
        lastName: "", // Will be filled in profile
        email,
        phone: "",
        joiningDate: new Date().toISOString(),
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      } as any);

      // In development, return token in response
      res.status(201).json({
        message: "Registration successful. Please verify your email.",
        token: process.env.NODE_ENV === 'development' ? verificationToken : undefined,
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
    // Convert Mongoose document to plain object if needed
    const user = req.user && typeof req.user.toObject === 'function' 
      ? req.user.toObject() 
      : req.user;
    res.json(user);
  });

  // Verify Email
  app.post(api.auth.verifyEmail.path, async (req, res) => {
    try {
      const { token } = req.body;
      const user = await storage.getUserByVerificationToken(token);

      if (!user) {
        return res.status(404).json({ message: "Invalid or expired verification token" });
      }

      // Mark email as verified
      await storage.updateUser(user._id.toString(), {
        emailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined,
      } as any);

      res.status(200).json({ message: "Email verified successfully. You can now login." });
    } catch (err) {
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Resend Verification Email
  app.post(api.auth.resendVerification.path, async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        // Don't reveal if user exists
        return res.status(200).json({ message: "If an account exists with this email, a verification token has been sent." });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new verification token
      const verificationToken = randomBytes(32).toString('hex');
      const verificationExpires = new Date();
      verificationExpires.setHours(verificationExpires.getHours() + 24);

      await storage.updateUser(user._id.toString(), {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      } as any);

      // In development, return token
      res.status(200).json({
        message: "Verification token sent. Check your email.",
        token: process.env.NODE_ENV === 'development' ? verificationToken : undefined,
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to resend verification" });
    }
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
    const users = await storage.getUsersByCompany(req.user.companyId.toString());
    
    // For HR/Admin, include today's attendance and leave status
    // @ts-ignore
    if (req.user.role === 'admin') {
      const today = new Date().toISOString().split('T')[0];
      // @ts-ignore
      const todayAttendance = await storage.getCompanyAttendance(req.user.companyId.toString(), today);
      const todayLeaves = await storage.getCompanyLeaves(req.user.companyId.toString());
      
      // Filter approved leaves for today
      const approvedLeavesToday = todayLeaves.filter((leave: any) => {
        if (leave.status !== 'approved') return false;
        const startDate = new Date(leave.startDate).toISOString().split('T')[0];
        const endDate = new Date(leave.endDate).toISOString().split('T')[0];
        return today >= startDate && today <= endDate;
      });
      
      const usersWithStatus = users.map((user: any) => {
        const userAttendance = todayAttendance.find((att: any) => 
          att.userId?.toString() === user._id?.toString() || att.userId?.toString() === user.id?.toString()
        );
        const userLeave = approvedLeavesToday.find((leave: any) =>
          leave.userId?.toString() === user._id?.toString() || leave.userId?.toString() === user.id?.toString()
        );
        
        let attendanceStatus: "present" | "absent" | "leave" = "absent";
        if (userLeave) {
          attendanceStatus = "leave";
        } else if (userAttendance && userAttendance.status === 'present') {
          attendanceStatus = "present";
        }
        
        return {
          ...user.toObject ? user.toObject() : user,
          todayAttendance: userAttendance ? {
            status: userAttendance.status,
            checkIn: userAttendance.checkIn,
            checkOut: userAttendance.checkOut
          } : null,
          attendanceStatus
        };
      });
      
      return res.json(usersWithStatus);
    }
    
    res.json(users);
  });

  app.post(api.users.create.path, requireAdmin, async (req, res) => {
    try {
      // @ts-ignore
      const userCompany = await storage.getCompanyById(req.user.companyId.toString());
      if (!userCompany) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      const { firstName, lastName, joiningDate } = req.body;
      const year = new Date(joiningDate).getFullYear();
      const loginId = await generateLoginId(userCompany.code, firstName, lastName, year);
      
      // Default password for new employees (e.g. "password123" or random)
      // Requirement says "system-generated".
      const tempPassword = "password123"; 
      const hashedPassword = await hashPassword(tempPassword);

      const user = await storage.createUser({
        ...req.body,
        // @ts-ignore
        companyId: req.user.companyId.toString(),
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
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  // Attendance
  app.post(api.attendance.checkIn.path, requireAuth, async (req, res) => {
    // @ts-ignore
    const record = await storage.checkIn(req.user._id.toString(), new Date().toISOString().split('T')[0]);
    res.json(record);
  });

  app.post(api.attendance.checkOut.path, requireAuth, async (req, res) => {
    try {
      // @ts-ignore
      const record = await storage.checkOut(req.user._id.toString(), new Date().toISOString().split('T')[0]);
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
      const records = await storage.getCompanyAttendance(req.user.companyId.toString(), req.query.date as string || new Date().toISOString().split('T')[0]);
      res.json(records);
    } else {
      // Employee sees own
      // @ts-ignore
      const records = await storage.getUserAttendanceRange(req.user._id.toString(), '2000-01-01', '2100-01-01'); // Simplified
      res.json(records);
    }
  });

  // Leaves
  app.get(api.leaves.list.path, requireAuth, async (req, res) => {
    // @ts-ignore
    if (req.user.role === 'admin') {
      // @ts-ignore
      const records = await storage.getCompanyLeaves(req.user.companyId.toString());
      res.json(records);
    } else {
      // @ts-ignore
      const records = await storage.getUserLeaves(req.user._id.toString());
      res.json(records);
    }
  });
  
  app.post(api.leaves.create.path, requireAuth, async (req, res) => {
    const leave = await storage.createLeave({
      ...req.body,
      // @ts-ignore
      userId: req.user._id.toString(),
      daysCount: 1, // Calculate based on start/end
      status: 'pending'
    });
    res.status(201).json(leave);
  });

  app.patch(api.leaves.updateStatus.path, requireAdmin, async (req, res) => {
    const leave = await storage.updateLeaveStatus(req.params.id, req.body.status);
    res.json(leave);
  });

  // Seeding Logic
  const existingHR = await storage.getUserByEmail("hr@dayflow.com");
  const existingEmp = await storage.getUserByEmail("employee@dayflow.com");
  
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

  if (!existingHR) {
    console.log("Seeding database...");
    
    // Create HR User (with verified email)
    const hrPass = await hashPassword("Hr@123456");
    await storage.createUser({
        companyId: company._id.toString(),
        loginId: "HR001",
        password: hrPass,
        role: "admin", // HR maps to admin role
        firstName: "Sarah",
        lastName: "Johnson",
        email: "hr@dayflow.com",
        phone: "123-456-7890",
        joiningDate: new Date().toISOString(),
        monthlyWage: 500000,
        status: "active",
        jobPosition: "HR Manager",
        department: "HR",
        emailVerified: true, // Pre-verified for seeding
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined,
    } as any);
  } else if (!existingHR.emailVerified) {
    // Fix existing HR user if email not verified
    await storage.updateUser(existingHR._id.toString(), {
      emailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
    } as any);
    console.log("Updated HR user email verification status");
  }

  if (!existingEmp) {
    // Create Employee (with verified email)
    const empPass = await hashPassword("Emp@123456");
    await storage.createUser({
        companyId: company._id.toString(),
        loginId: "EMP001",
        password: empPass,
        role: "employee",
        firstName: "John",
        lastName: "Doe",
        email: "employee@dayflow.com",
        phone: "098-765-4321",
        joiningDate: new Date().toISOString(),
        monthlyWage: 300000,
        status: "active",
        jobPosition: "Software Developer",
        department: "Engineering",
        emailVerified: true, // Pre-verified for seeding
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined,
    } as any);
  } else if (!existingEmp.emailVerified) {
    // Fix existing Employee user if email not verified
    await storage.updateUser(existingEmp._id.toString(), {
      emailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
    } as any);
    console.log("Updated Employee user email verification status");
  }
  
  if (!existingHR || !existingEmp) {
    console.log("Database seeded successfully!");
    console.log("HR User:");
    console.log("  Email: hr@dayflow.com");
    console.log("  Password: Hr@123456");
    console.log("  Employee ID: HR001");
    console.log("");
    console.log("Employee User:");
    console.log("  Email: employee@dayflow.com");
    console.log("  Password: Emp@123456");
    console.log("  Employee ID: EMP001");
  }

  return httpServer;
}
