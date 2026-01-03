import { pgTable, text, serial, integer, boolean, timestamp, date, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // e.g. OIJD
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  loginId: text("login_id").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "employee"] }).notNull().default("employee"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  jobPosition: text("job_position"),
  department: text("department"),
  managerId: integer("manager_id"), 
  location: text("location"),
  joiningDate: date("joining_date").notNull(),
  
  // Personal Info
  dob: date("dob"),
  address: text("address"),
  nationality: text("nationality"),
  personalEmail: text("personal_email"),
  gender: text("gender"),
  maritalStatus: text("marital_status"),
  
  // Bank Info
  accountNumber: text("account_number"),
  bankName: text("bank_name"),
  ifscCode: text("ifsc_code"),
  panNo: text("pan_no"),
  uanNo: text("uan_no"),
  
  // Salary Info (Admin view)
  monthlyWage: integer("monthly_wage"), // Stored as integer
  workingDaysPerWeek: integer("working_days_per_week").default(5),
  breakTime: numeric("break_time").default("1"),
  
  status: text("status", { enum: ["active", "inactive"] }).default("active"),
  avatarUrl: text("avatar_url"),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  checkIn: timestamp("check_in"),
  checkOut: timestamp("check_out"),
  status: text("status", { enum: ["present", "absent", "leave"] }).default("absent"),
  workHours: numeric("work_hours"), 
});

export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type", { enum: ["paid", "sick", "unpaid"] }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  attachmentUrl: text("attachment_url"),
  daysCount: integer("days_count"),
});

// Relations
export const companyRelations = relations(companies, ({ many }) => ({
  users: many(users),
}));

export const userRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  attendance: many(attendance),
  leaves: many(leaves),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, {
    fields: [attendance.userId],
    references: [users.id],
  }),
}));

export const leavesRelations = relations(leaves, ({ one }) => ({
  user: one(users, {
    fields: [leaves.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertCompanySchema = createInsertSchema(companies);
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertLeaveSchema = createInsertSchema(leaves).omit({ id: true });

// Types
export type Company = typeof companies.$inferSelect;
export type User = typeof users.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Leave = typeof leaves.$inferSelect;
