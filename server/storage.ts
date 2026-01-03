import {
  User, Company, Attendance, Leave,
  type IUser, type ICompany, type IAttendance, type ILeave,
  type InsertUser, type InsertCompany
} from "@shared/schema";
import mongoose from "mongoose";

export interface IStorage {
  // Users & Auth
  getUser(id: string): Promise<IUser | undefined>;
  getUserByLoginId(loginId: string): Promise<IUser | undefined>;
  getUserByEmail(email: string): Promise<IUser | undefined>;
  getUserByVerificationToken(token: string): Promise<IUser | undefined>;
  createUser(user: InsertUser): Promise<IUser>;
  updateUser(id: string, user: Partial<IUser>): Promise<IUser>;
  getUsersByCompany(companyId: string): Promise<IUser[]>;
  
  // Companies
  createCompany(company: InsertCompany): Promise<ICompany>;
  getCompanyByCode(code: string): Promise<ICompany | undefined>;
  getCompanyById(id: string): Promise<ICompany | undefined>;
  
  // Attendance
  getAttendance(userId: string, date: string): Promise<IAttendance | undefined>;
  checkIn(userId: string, date: string): Promise<IAttendance>;
  checkOut(userId: string, date: string): Promise<IAttendance>;
  getCompanyAttendance(companyId: string, date: string): Promise<IAttendance[]>;
  getUserAttendanceRange(userId: string, startDate: string, endDate: string): Promise<IAttendance[]>;
  
  // Leaves
  createLeave(leave: any): Promise<ILeave>;
  getCompanyLeaves(companyId: string): Promise<ILeave[]>;
  getUserLeaves(userId: string): Promise<ILeave[]>;
  updateLeaveStatus(id: string, status: string): Promise<ILeave>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<IUser | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const user = await User.findById(id).exec();
    if (!user) return undefined;
    // Convert to plain object for better JSON serialization
    return user.toObject ? user.toObject() : user;
  }

  async getUserByLoginId(loginId: string): Promise<IUser | undefined> {
    const user = await User.findOne({ loginId }).exec();
    // Return Mongoose document for passport (needs _id as ObjectId)
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<IUser | undefined> {
    const user = await User.findOne({ email }).exec();
    return user || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<IUser | undefined> {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }, // Token not expired
    }).exec();
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<IUser> {
    const user = new User({
      ...userData,
      companyId: userData.companyId ? new mongoose.Types.ObjectId(userData.companyId) : undefined,
      managerId: userData.managerId ? new mongoose.Types.ObjectId(userData.managerId) : undefined,
      joiningDate: userData.joiningDate ? new Date(userData.joiningDate) : new Date(),
      dob: userData.dob ? new Date(userData.dob) : undefined,
    });
    return await user.save();
  }
  
  async updateUser(id: string, updates: Partial<IUser>): Promise<IUser> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID");
    }
    const updated = await User.findByIdAndUpdate(id, updates, { new: true }).exec();
    if (!updated) {
      throw new Error("User not found");
    }
    return updated;
  }

  async getUsersByCompany(companyId: string): Promise<IUser[]> {
    if (!mongoose.Types.ObjectId.isValid(companyId)) return [];
    return await User.find({ companyId: new mongoose.Types.ObjectId(companyId) }).exec();
  }

  async createCompany(companyData: InsertCompany): Promise<ICompany> {
    const company = new Company(companyData);
    return await company.save();
  }
  
  async getCompanyByCode(code: string): Promise<ICompany | undefined> {
    return await Company.findOne({ code }).exec() || undefined;
  }

  async getCompanyById(id: string): Promise<ICompany | undefined> {
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    return await Company.findById(id).exec() || undefined;
  }

  // Attendance
  async getAttendance(userId: string, date: string): Promise<IAttendance | undefined> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return undefined;
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return await Attendance.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      date: { $gte: dateObj, $lt: nextDay }
    }).exec() || undefined;
  }

  async checkIn(userId: string, date: string): Promise<IAttendance> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }
    
    const existing = await this.getAttendance(userId, date);
    if (existing) return existing;
    
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    
    const record = new Attendance({
      userId: new mongoose.Types.ObjectId(userId),
      date: dateObj,
      checkIn: new Date(),
      status: 'present'
    });
    return await record.save();
  }

  async checkOut(userId: string, date: string): Promise<IAttendance> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }
    
    const existing = await this.getAttendance(userId, date);
    if (!existing) throw new Error("Must check in first");
    
    const checkOutTime = new Date();
    const checkInTime = existing.checkIn!;
    const hours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    
    existing.checkOut = checkOutTime;
    existing.workHours = Number(hours.toFixed(2));
    return await existing.save();
  }
  
  async getCompanyAttendance(companyId: string, date: string): Promise<IAttendance[]> {
    if (!mongoose.Types.ObjectId.isValid(companyId)) return [];
    
    const companyUsers = await this.getUsersByCompany(companyId);
    const userIds = companyUsers.map(u => u._id);
    if (userIds.length === 0) return [];
    
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return await Attendance.find({
      userId: { $in: userIds },
      date: { $gte: dateObj, $lt: nextDay }
    }).exec();
  }
  
  async getUserAttendanceRange(userId: string, startDate: string, endDate: string): Promise<IAttendance[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return await Attendance.find({
      userId: new mongoose.Types.ObjectId(userId),
      date: { $gte: start, $lte: end }
    }).exec();
  }

  // Leaves
  async createLeave(leaveData: any): Promise<ILeave> {
    const leave = new Leave({
      ...leaveData,
      userId: leaveData.userId ? new mongoose.Types.ObjectId(leaveData.userId) : undefined,
      startDate: leaveData.startDate ? new Date(leaveData.startDate) : new Date(),
      endDate: leaveData.endDate ? new Date(leaveData.endDate) : new Date(),
    });
    return await leave.save();
  }

  async getCompanyLeaves(companyId: string): Promise<ILeave[]> {
    if (!mongoose.Types.ObjectId.isValid(companyId)) return [];
    
    const companyUsers = await this.getUsersByCompany(companyId);
    const userIds = companyUsers.map(u => u._id);
    if (userIds.length === 0) return [];
    
    return await Leave.find({
      userId: { $in: userIds }
    }).exec();
  }
  
  async getUserLeaves(userId: string): Promise<ILeave[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];
    return await Leave.find({ userId: new mongoose.Types.ObjectId(userId) }).exec();
  }
  
  async updateLeaveStatus(id: string, status: string): Promise<ILeave> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid leave ID");
    }
    const updated = await Leave.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).exec();
    if (!updated) {
      throw new Error("Leave not found");
    }
    return updated;
  }
}

export const storage = new DatabaseStorage();
