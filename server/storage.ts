import { db } from "./db";
import {
  users, companies, attendance, leaves,
  type User, type InsertUser, type Company, type Attendance, type Leave,
  type InsertCompany // Add this to schema export if not there, or infer it
} from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users & Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByLoginId(loginId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;
  getUsersByCompany(companyId: number): Promise<User[]>;
  
  // Companies
  createCompany(company: any): Promise<Company>; // Typed 'any' for now, should be InsertCompany
  getCompanyByCode(code: string): Promise<Company | undefined>;
  
  // Attendance
  getAttendance(userId: number, date: string): Promise<Attendance | undefined>;
  checkIn(userId: number, date: string): Promise<Attendance>;
  checkOut(userId: number, date: string): Promise<Attendance>;
  getCompanyAttendance(companyId: number, date: string): Promise<Attendance[]>;
  getUserAttendanceRange(userId: number, startDate: string, endDate: string): Promise<Attendance[]>;
  
  // Leaves
  createLeave(leave: any): Promise<Leave>;
  getCompanyLeaves(companyId: number): Promise<Leave[]>;
  getUserLeaves(userId: number): Promise<Leave[]>;
  updateLeaveStatus(id: number, status: string): Promise<Leave>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByLoginId(loginId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.loginId, loginId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated;
  }

  async getUsersByCompany(companyId: number): Promise<User[]> {
    return db.select().from(users).where(eq(users.companyId, companyId));
  }

  async createCompany(company: any): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }
  
  async getCompanyByCode(code: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.code, code));
    return company;
  }

  // Attendance
  async getAttendance(userId: number, date: string): Promise<Attendance | undefined> {
    const [record] = await db.select().from(attendance)
      .where(and(eq(attendance.userId, userId), eq(attendance.date, date)));
    return record;
  }

  async checkIn(userId: number, date: string): Promise<Attendance> {
    const existing = await this.getAttendance(userId, date);
    if (existing) return existing;
    
    const [record] = await db.insert(attendance).values({
      userId,
      date,
      checkIn: new Date(),
      status: 'present'
    }).returning();
    return record;
  }

  async checkOut(userId: number, date: string): Promise<Attendance> {
    const existing = await this.getAttendance(userId, date);
    if (!existing) throw new Error("Must check in first");
    
    const checkOutTime = new Date();
    // Calculate work hours
    const checkInTime = new Date(existing.checkIn!);
    const hours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    
    const [record] = await db.update(attendance)
      .set({ checkOut: checkOutTime, workHours: hours.toFixed(2) })
      .where(eq(attendance.id, existing.id))
      .returning();
    return record;
  }
  
  async getCompanyAttendance(companyId: number, date: string): Promise<Attendance[]> {
    // Join with users to filter by company
    // This is a simplified query, might need explicit join in real implementation
    const companyUsers = await this.getUsersByCompany(companyId);
    const userIds = companyUsers.map(u => u.id);
    if (userIds.length === 0) return [];
    
    // For now, simpler to fetch all and filter in app or doing a raw query, 
    // but Drizzle query builder is better:
    /*
    return db.select({
      attendance: attendance
    }).from(attendance)
      .innerJoin(users, eq(attendance.userId, users.id))
      .where(and(eq(users.companyId, companyId), eq(attendance.date, date)));
    */
   // Fallback to fetching logic for simplicity in this file
   const records = await db.select().from(attendance).where(eq(attendance.date, date));
   return records.filter(r => userIds.includes(r.userId));
  }
  
  async getUserAttendanceRange(userId: number, startDate: string, endDate: string): Promise<Attendance[]> {
    return db.select().from(attendance)
      .where(and(
        eq(attendance.userId, userId),
        gte(attendance.date, startDate),
        lte(attendance.date, endDate)
      ));
  }

  // Leaves
  async createLeave(leave: any): Promise<Leave> {
    const [record] = await db.insert(leaves).values(leave).returning();
    return record;
  }

  async getCompanyLeaves(companyId: number): Promise<Leave[]> {
    const companyUsers = await this.getUsersByCompany(companyId);
    const userIds = companyUsers.map(u => u.id);
    if (userIds.length === 0) return [];
    
    // Similarly, simplified fetch
    const records = await db.select().from(leaves);
    return records.filter(r => userIds.includes(r.userId));
  }
  
  async getUserLeaves(userId: number): Promise<Leave[]> {
    return db.select().from(leaves).where(eq(leaves.userId, userId));
  }
  
  async updateLeaveStatus(id: number, status: string): Promise<Leave> {
    // @ts-ignore
    const [updated] = await db.update(leaves).set({ status }).where(eq(leaves.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
