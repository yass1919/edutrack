import { pgTable, text, serial, integer, boolean, timestamp, varchar, numeric, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Table centrale pour les années scolaires
export const academicYears = pgTable("academic_years", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 9 }).notNull().unique(), // '2024-2025'
  status: varchar("status", { length: 20 }).notNull().default("inactive"), // 'active', 'inactive', 'archived'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // 'teacher', 'inspector', 'founder', 'admin', 'sg'
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }).default("0.00"), // Tarif horaire en MAD
  isActive: boolean("is_active").default(true), // Actif/inactif par défaut
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  description: text("description"),
});

export const levels = pgTable("levels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // '6ème', '5ème', '4ème', '3ème', 'Seconde', etc.
  code: varchar("code", { length: 10 }).notNull().unique(),
  category: varchar("category", { length: 20 }).notNull(), // 'college', 'lycee'
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // '6ème A', '5ème B', etc.
  levelId: integer("level_id").references(() => levels.id).notNull(),
  academicYearId: integer("academic_year_id").references(() => academicYears.id).notNull(),
  floor: varchar("floor", { length: 10 }), // Étage de la classe
  capacity: integer("capacity"), // Capacité de la classe
  interactiveBoard: boolean("interactive_board").default(false), // Tableau interactif
  whiteboard: boolean("whiteboard").default(false), // Tableau blanc
  projector: boolean("projector").default(false), // Vidéoprojecteur
  camera: boolean("camera").default(false), // Caméra
  delegate: varchar("delegate", { length: 255 }), // Délégué de classe
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueClassPerYear: unique().on(table.name, table.levelId, table.academicYearId),
}));

// Table d'historique des affectations utilisateurs par année
export const userAcademicYearStatus = pgTable("user_academic_year_status", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  academicYearId: integer("academic_year_id").references(() => academicYears.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserYear: unique().on(table.userId, table.academicYearId),
}));

export const teacherAssignments = pgTable("teacher_assignments", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  academicYearId: integer("academic_year_id").references(() => academicYears.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueTeacherAssignment: unique().on(table.teacherId, table.classId, table.subjectId, table.academicYearId),
}));

export const inspectorAssignments = pgTable("inspector_assignments", {
  id: serial("id").primaryKey(),
  inspectorId: integer("inspector_id").references(() => users.id).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  academicYearId: integer("academic_year_id").references(() => academicYears.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueInspectorAssignment: unique().on(table.inspectorId, table.subjectId, table.academicYearId),
}));

export const sgAssignments = pgTable("sg_assignments", {
  id: serial("id").primaryKey(),
  sgId: integer("sg_id").references(() => users.id).notNull(),
  cycle: varchar("cycle", { length: 20 }).notNull(), // 'college' or 'lycee'
  academicYearId: integer("academic_year_id").references(() => academicYears.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueSgAssignment: unique().on(table.sgId, table.cycle, table.academicYearId),
}));

// Programme pédagogique par année (permet l'évolution du contenu)
export const pedagogicalPrograms = pgTable("pedagogical_programs", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  levelId: integer("level_id").references(() => levels.id).notNull(),
  academicYearId: integer("academic_year_id").references(() => academicYears.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueProgramPerYear: unique().on(table.subjectId, table.levelId, table.academicYearId),
}));

export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  levelId: integer("level_id").references(() => levels.id).notNull(),
  pedagogicalProgramId: integer("pedagogical_program_id").references(() => pedagogicalPrograms.id),
  orderIndex: integer("order_index").notNull(),
  trimester: integer("trimester").notNull(), // 1, 2, or 3
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  objectives: text("objectives"),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull(),
  plannedDate: timestamp("planned_date"),
  plannedDurationMinutes: integer("planned_duration_minutes").notNull(),
  orderIndex: integer("order_index").notNull(),
  academicYearId: integer("academic_year_id").references(() => academicYears.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lessonProgressions = pgTable("lesson_progressions", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").references(() => lessons.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  actualDate: timestamp("actual_date"),
  actualDurationMinutes: integer("actual_duration_minutes"),
  notes: text("notes"),
  sessionType: varchar("session_type", { length: 20 }).default('lesson'), // 'lesson', 'exercises', 'control', 'revision'
  chapterElements: text("chapter_elements"), // JSON array of completed chapter elements
  status: varchar("status", { length: 20 }).notNull().default('planned'), // 'planned', 'completed', 'validated', 'delayed'
  validatedBy: integer("validated_by").references(() => users.id),
  validatedAt: timestamp("validated_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chapterElements = pgTable("chapter_elements", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull().default(0),
  estimatedDurationMinutes: integer("estimated_duration_minutes").default(55),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // 'login', 'create_user', 'create_lesson', etc.
  entityType: varchar("entity_type", { length: 50 }), // 'user', 'lesson', 'class', etc.
  entityId: integer("entity_id"),
  details: text("details"), // JSON string with additional details
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'delay', 'validation', 'reminder'
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  entityType: varchar("entity_type", { length: 50 }), // 'lesson', 'progression', etc.
  entityId: integer("entity_id"),
  isRead: boolean("is_read").default(false).notNull(),
  priority: varchar("priority", { length: 20 }).default('normal'), // 'low', 'normal', 'high', 'urgent'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

// Table pour les signalements de problèmes par les professeurs
export const anomalyReports = pgTable("anomaly_reports", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 30 }).notNull(), // 'content', 'hours', 'schedule', 'incident'
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  lessonId: integer("lesson_id").references(() => lessons.id),
  classId: integer("class_id").references(() => classes.id),
  subjectId: integer("subject_id").references(() => subjects.id),
  recipients: text("recipients").array().notNull(), // ['fondateur', 'sg', 'inspecteur']
  status: varchar("status", { length: 20 }).default("open").notNull(), // 'open', 'in_review', 'resolved', 'rejected'
  priority: varchar("priority", { length: 20 }).default("normal").notNull(),
  reviewedBy: integer("reviewed_by").references(() => users.id), // SG, Inspector ou Founder qui traite
  reviewNotes: text("review_notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table pour les évaluations et rapports du Surveillant Général
export const sgReports = pgTable("sg_reports", {
  id: serial("id").primaryKey(),
  sgId: integer("sg_id").references(() => users.id).notNull(), // Le SG qui fait le rapport
  teacherId: integer("teacher_id").references(() => users.id).notNull(), // Le professeur évalué
  lessonProgressionId: integer("lesson_progression_id").references(() => lessonProgressions.id),
  classId: integer("class_id").references(() => classes.id).notNull(),
  
  // Validation des horaires et séances
  scheduleValidated: boolean("schedule_validated").default(false),
  actualStartTime: varchar("actual_start_time", { length: 5 }), // format HH:MM
  actualEndTime: varchar("actual_end_time", { length: 5 }), // format HH:MM
  
  // Présence du professeur
  teacherPresent: boolean("teacher_present").default(true),
  teacherLateMinutes: integer("teacher_late_minutes").default(0),
  
  // Appréciation du professeur
  teacherRating: integer("teacher_rating"), // 1-5 étoiles
  teacherAppreciation: text("teacher_appreciation"),
  
  // Incidents et observations
  incidents: text("incidents"), // Description des incidents
  observations: text("observations"), // Observations générales
  studentsPresent: integer("students_present"),
  studentsTotal: integer("students_total"),
  
  // Validation générale
  sessionValidated: boolean("session_validated").default(false),
  validationNotes: text("validation_notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const academicYearsRelations = relations(academicYears, ({ many }) => ({
  classes: many(classes),
  teacherAssignments: many(teacherAssignments),
  inspectorAssignments: many(inspectorAssignments),
  sgAssignments: many(sgAssignments),
  lessons: many(lessons),
  pedagogicalPrograms: many(pedagogicalPrograms),
  userStatuses: many(userAcademicYearStatus),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teacherAssignments: many(teacherAssignments),
  inspectorAssignments: many(inspectorAssignments),
  lessonProgressions: many(lessonProgressions),
  validatedProgressions: many(lessonProgressions),
  notifications: many(notifications),
  anomalyReports: many(anomalyReports),
  sgReports: many(sgReports),
  reviewedAnomalies: many(anomalyReports),
  academicYearStatuses: many(userAcademicYearStatus),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  teacherAssignments: many(teacherAssignments),
  inspectorAssignments: many(inspectorAssignments),
  chapters: many(chapters),
}));

export const levelsRelations = relations(levels, ({ many }) => ({
  classes: many(classes),
  chapters: many(chapters),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  level: one(levels, {
    fields: [classes.levelId],
    references: [levels.id],
  }),
  academicYear: one(academicYears, {
    fields: [classes.academicYearId],
    references: [academicYears.id],
  }),
  teacherAssignments: many(teacherAssignments),
  lessonProgressions: many(lessonProgressions),
}));

export const teacherAssignmentsRelations = relations(teacherAssignments, ({ one }) => ({
  teacher: one(users, {
    fields: [teacherAssignments.teacherId],
    references: [users.id],
  }),
  class: one(classes, {
    fields: [teacherAssignments.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [teacherAssignments.subjectId],
    references: [subjects.id],
  }),
  academicYear: one(academicYears, {
    fields: [teacherAssignments.academicYearId],
    references: [academicYears.id],
  }),
}));

export const inspectorAssignmentsRelations = relations(inspectorAssignments, ({ one }) => ({
  inspector: one(users, {
    fields: [inspectorAssignments.inspectorId],
    references: [users.id],
  }),
  subject: one(subjects, {
    fields: [inspectorAssignments.subjectId],
    references: [subjects.id],
  }),
}));

export const sgAssignmentsRelations = relations(sgAssignments, ({ one }) => ({
  sg: one(users, {
    fields: [sgAssignments.sgId],
    references: [users.id],
  }),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [chapters.subjectId],
    references: [subjects.id],
  }),
  level: one(levels, {
    fields: [chapters.levelId],
    references: [levels.id],
  }),
  lessons: many(lessons),
  elements: many(chapterElements),
}));

export const chapterElementsRelations = relations(chapterElements, ({ one }) => ({
  chapter: one(chapters, {
    fields: [chapterElements.chapterId],
    references: [chapters.id],
  }),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [lessons.chapterId],
    references: [chapters.id],
  }),
  progressions: many(lessonProgressions),
}));

export const lessonProgressionsRelations = relations(lessonProgressions, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonProgressions.lessonId],
    references: [lessons.id],
  }),
  class: one(classes, {
    fields: [lessonProgressions.classId],
    references: [classes.id],
  }),
  teacher: one(users, {
    fields: [lessonProgressions.teacherId],
    references: [users.id],
  }),
  validator: one(users, {
    fields: [lessonProgressions.validatedBy],
    references: [users.id],
  }),
}));

// Relations pour les nouvelles tables
export const anomalyReportsRelations = relations(anomalyReports, ({ one }) => ({
  teacher: one(users, {
    fields: [anomalyReports.teacherId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [anomalyReports.lessonId],
    references: [lessons.id],
  }),
  class: one(classes, {
    fields: [anomalyReports.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [anomalyReports.subjectId],
    references: [subjects.id],
  }),
  reviewer: one(users, {
    fields: [anomalyReports.reviewedBy],
    references: [users.id],
  }),
}));

export const sgReportsRelations = relations(sgReports, ({ one }) => ({
  sg: one(users, {
    fields: [sgReports.sgId],
    references: [users.id],
  }),
  teacher: one(users, {
    fields: [sgReports.teacherId],
    references: [users.id],
  }),
  lessonProgression: one(lessonProgressions, {
    fields: [sgReports.lessonProgressionId],
    references: [lessonProgressions.id],
  }),
  class: one(classes, {
    fields: [sgReports.classId],
    references: [classes.id],
  }),
}));

// Insert schemas
export const insertAcademicYearSchema = createInsertSchema(academicYears).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
});

export const insertLevelSchema = createInsertSchema(levels).omit({
  id: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherAssignmentSchema = createInsertSchema(teacherAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertInspectorAssignmentSchema = createInsertSchema(inspectorAssignments).omit({
  id: true,
});

export const insertChapterSchema = createInsertSchema(chapters).omit({
  id: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
}).extend({
  orderIndex: z.number().optional(),
});

export const insertLessonProgressionSchema = createInsertSchema(lessonProgressions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChapterElementSchema = createInsertSchema(chapterElements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertAnomalyReportSchema = createInsertSchema(anomalyReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

// Frontend schema without teacherId (added by server)
export const frontendAnomalyReportSchema = insertAnomalyReportSchema.omit({
  teacherId: true,
});

export const insertSgReportSchema = createInsertSchema(sgReports).omit({
  id: true,
  sgId: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Nom d'utilisateur requis"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const markLessonCompletedSchema = z.object({
  lessonId: z.number(),
  classId: z.number(),
  actualDate: z.string(),
  actualDurationMinutes: z.number(),
  notes: z.string().optional(),
  sessionType: z.enum(['lesson', 'exercises', 'control', 'revision']).default('lesson'),
  chapterElements: z.array(z.number()).optional(), // Array of chapter element IDs
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(6),
  role: z.enum(['teacher', 'inspector', 'founder', 'admin', 'sg']),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  // Assignment fields - conditional validation will be handled in the API
  subjectId: z.string().optional(), // for teacher and inspector (converted to number in API)
  cycle: z.string().optional(), // for SG
  selectedClasses: z.array(z.number()).optional(), // for teacher - class assignments
});

export const registerSchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(6),
  role: z.enum(['teacher', 'inspector', 'sg']), // Only these roles for public registration
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(100).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['teacher', 'inspector', 'founder', 'admin', 'sg']).optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Level = typeof levels.$inferSelect;
export type InsertLevel = z.infer<typeof insertLevelSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type TeacherAssignment = typeof teacherAssignments.$inferSelect;
export type InsertTeacherAssignment = z.infer<typeof insertTeacherAssignmentSchema>;
export type InspectorAssignment = typeof inspectorAssignments.$inferSelect;
export type InsertInspectorAssignment = z.infer<typeof insertInspectorAssignmentSchema>;
export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = z.infer<typeof insertChapterSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type LessonProgression = typeof lessonProgressions.$inferSelect;
export type InsertLessonProgression = z.infer<typeof insertLessonProgressionSchema>;
export type ChapterElement = typeof chapterElements.$inferSelect;
export type InsertChapterElement = z.infer<typeof insertChapterElementSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type AnomalyReport = typeof anomalyReports.$inferSelect;
export type InsertAnomalyReport = z.infer<typeof insertAnomalyReportSchema>;
export type SgReport = typeof sgReports.$inferSelect;
export type InsertSgReport = z.infer<typeof insertSgReportSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type MarkLessonCompletedData = z.infer<typeof markLessonCompletedSchema>;
export type CreateUserData = z.infer<typeof createUserSchema>;

// Enhanced class management schema
export const updateClassSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  levelId: z.number().optional(),
  floor: z.string().max(10).optional(),
  capacity: z.number().min(1).max(100).optional(),
  interactiveBoard: z.boolean().optional(),
  whiteboard: z.boolean().optional(),
  projector: z.boolean().optional(),
  camera: z.boolean().optional(),
  delegate: z.string().max(255).optional(),
});

export type UpdateClass = z.infer<typeof updateClassSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
