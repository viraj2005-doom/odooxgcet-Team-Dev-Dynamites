import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

// Company Schema
export interface ICompany extends Document {
  name: string;
  code: string;
  email: string;
  phone: string;
  logoUrl?: string;
  createdAt: Date;
}

const companySchema = new Schema<ICompany>({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  logoUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Company = mongoose.model<ICompany>("Company", companySchema);

// User Schema
export interface IUser extends Document {
  companyId: mongoose.Types.ObjectId;
  loginId: string;
  password: string;
  role: "admin" | "employee";
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobPosition?: string;
  department?: string;
  managerId?: mongoose.Types.ObjectId;
  location?: string;
  joiningDate: Date;
  
  // Personal Info
  dob?: Date;
  address?: string;
  nationality?: string;
  personalEmail?: string;
  gender?: string;
  maritalStatus?: string;
  
  // Bank Info
  accountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  panNo?: string;
  uanNo?: string;
  
  // Salary Info
  monthlyWage?: number;
  workingDaysPerWeek?: number;
  breakTime?: number;
  
  status?: "active" | "inactive";
  avatarUrl?: string;
}

const userSchema = new Schema<IUser>({
  companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
  loginId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "employee"], default: "employee", required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  jobPosition: { type: String },
  department: { type: String },
  managerId: { type: Schema.Types.ObjectId, ref: "User" },
  location: { type: String },
  joiningDate: { type: Date, required: true },
  
  // Personal Info
  dob: { type: Date },
  address: { type: String },
  nationality: { type: String },
  personalEmail: { type: String },
  gender: { type: String },
  maritalStatus: { type: String },
  
  // Bank Info
  accountNumber: { type: String },
  bankName: { type: String },
  ifscCode: { type: String },
  panNo: { type: String },
  uanNo: { type: String },
  
  // Salary Info
  monthlyWage: { type: Number },
  workingDaysPerWeek: { type: Number, default: 5 },
  breakTime: { type: Number, default: 1 },
  
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  avatarUrl: { type: String },
  
  // Email Verification
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
});

export const User = mongoose.model<IUser>("User", userSchema);

// Attendance Schema
export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status: "present" | "absent" | "leave";
  workHours?: number;
}

const attendanceSchema = new Schema<IAttendance>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: { type: String, enum: ["present", "absent", "leave"], default: "absent" },
  workHours: { type: Number },
});

// Compound index to ensure one attendance record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>("Attendance", attendanceSchema);

// Leave Schema
export interface ILeave extends Document {
  userId: mongoose.Types.ObjectId;
  type: "paid" | "sick" | "unpaid";
  startDate: Date;
  endDate: Date;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  attachmentUrl?: string;
  daysCount?: number;
}

const leaveSchema = new Schema<ILeave>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["paid", "sick", "unpaid"], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  attachmentUrl: { type: String },
  daysCount: { type: Number },
});

export const Leave = mongoose.model<ILeave>("Leave", leaveSchema);

// Zod Schemas for validation
export const insertCompanySchema = z.object({
  name: z.string(),
  code: z.string(),
  email: z.string().email(),
  phone: z.string(),
  logoUrl: z.string().optional(),
});

export const insertUserSchema = z.object({
  companyId: z.string().optional(), // Will be converted to ObjectId
  loginId: z.string(),
  password: z.string(),
  role: z.enum(["admin", "employee"]).optional(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string(),
  jobPosition: z.string().optional(),
  department: z.string().optional(),
  managerId: z.string().optional(),
  location: z.string().optional(),
  joiningDate: z.string().or(z.date()),
  dob: z.string().or(z.date()).optional(),
  address: z.string().optional(),
  nationality: z.string().optional(),
  personalEmail: z.string().email().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  ifscCode: z.string().optional(),
  panNo: z.string().optional(),
  uanNo: z.string().optional(),
  monthlyWage: z.number().optional(),
  workingDaysPerWeek: z.number().optional(),
  breakTime: z.number().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  avatarUrl: z.string().optional(),
});

export const insertAttendanceSchema = z.object({
  userId: z.string().optional(), // Will be converted to ObjectId
  date: z.string().or(z.date()),
  checkIn: z.date().optional(),
  checkOut: z.date().optional(),
  status: z.enum(["present", "absent", "leave"]).optional(),
  workHours: z.number().optional(),
});

export const insertLeaveSchema = z.object({
  userId: z.string().optional(), // Will be converted to ObjectId
  type: z.enum(["paid", "sick", "unpaid"]),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  reason: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  attachmentUrl: z.string().optional(),
  daysCount: z.number().optional(),
});

// Type exports
export type Company = ICompany;
export type User = IUser;
export type Attendance = IAttendance;
export type Leave = ILeave;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertLeave = z.infer<typeof insertLeaveSchema>;
