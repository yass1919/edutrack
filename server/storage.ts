import * as schema from "@shared/schema";
import {
  type User,
  type InsertUser,
  type Subject,
  type Level,
  type Class,
  type TeacherAssignment,
  type InspectorAssignment,
  type Chapter,
  type ChapterElement,
  type InsertChapterElement,
  type Lesson,
  type LessonProgression,
  type InsertLessonProgression,
  type MarkLessonCompletedData,
  type CreateUserData,
  type UpdateUserData,
  type InsertSubject,
  type InsertLevel,
  type InsertClass,
  type InsertLesson,
  type AuditLog,
  type InsertAuditLog,
  type Notification,
  type InsertNotification,
  type AnomalyReport,
  type InsertAnomalyReport,
  type SgReport,
  type InsertSgReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, inArray, or, like, isNull, isNotNull, count, gte, lte } from "drizzle-orm";

// Utility function to determine cycle based on level name
function getCycleFromLevel(levelName: string): string {
  const collegeLevels = ['1AC', '2AC', '3AC'];
  
  // Check for college levels
  if (collegeLevels.includes(levelName)) {
    return 'college';
  }
  
  // Check for lycée levels - more flexible matching
  if (levelName === 'TC' || 
      levelName.includes('Bac') || 
      levelName.includes('BAC') ||
      levelName.includes('Terminale') ||
      levelName.includes('1ère') ||
      levelName.includes('2ème')) {
    return 'lycee';
  }
  
  // Default fallback - should not happen with proper data
  return 'college';
}

export interface IStorage {
  // Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Teacher assignments
  getTeacherAssignments(teacherId: number): Promise<(TeacherAssignment & {
    class: Class & { level: Level };
    subject: Subject;
  })[]>;
  getAllTeacherAssignments(): Promise<(TeacherAssignment & {
    teacher: User;
    class: Class & { level: Level };
    subject: Subject;
  })[]>;
  
  // Classes and schema.subjects
  getClassesByTeacher(teacherId: number): Promise<(Class & { level: Level })[]>;
  getSubjectsByTeacher(teacherId: number): Promise<Subject[]>;
  
  // Inspector specific methods
  getTeachersByInspectorSubject(inspectorId: number, academicYear?: string): Promise<(User & {
    assignments: (TeacherAssignment & { class: Class & { level: Level }; subject: Subject })[];
  })[]>;
  getProgressionsByTeacher(teacherId: number, academicYear?: string): Promise<(LessonProgression & {
    lesson: Lesson & { chapter: Chapter };
    class: Class & { level: Level };
  })[]>;
  getProgressionsByTeacherAndClass(teacherId: number, classId: number, academicYear?: string): Promise<(LessonProgression & {
    lesson: Lesson & { chapter: Chapter };
    class: Class & { level: Level };
  })[]>;
  getInspectorSubjects(inspectorId: number, academicYear?: string): Promise<InspectorAssignment[]>;
  getInspectorProgressions(inspectorId: number): Promise<(LessonProgression & {
    lesson: Lesson & { chapter: Chapter };
    class: Class & { level: Level };
    teacher: User;
  })[]>;
  getInspectorProgressionsByTeacher(teacherId: number, subjectIds: number[]): Promise<(LessonProgression & {
    lesson: Lesson & { chapter: Chapter };
    class: Class & { level: Level };
    teacher: User;
  })[]>;
  getInspectorProgressionsByTeacherAndClass(teacherId: number, classId: number, subjectIds: number[]): Promise<(LessonProgression & {
    lesson: Lesson & { chapter: Chapter };
    class: Class & { level: Level };
    teacher: User;
  })[]>;
  
  // Lessons and progressions
  getLessonsByClassAndSubject(classId: number, subjectId: number): Promise<(Lesson & {
    chapter: Chapter;
    progressions: LessonProgression[];
  })[]>;
  
  getProgressionsByClass(classId: number): Promise<(LessonProgression & {
    lesson: Lesson & { chapter: Chapter };
    class: Class & { level: Level };
    teacher: User;
  })[]>;
  
  markLessonCompleted(data: MarkLessonCompletedData & { teacherId: number }): Promise<LessonProgression>;
  
  validateProgression(progressionId: number, validatorId: number): Promise<LessonProgression>;
  
  // Dashboard data
  getProgressionStats(teacherId?: number): Promise<{
    totalLessons: number;
    completedLessons: number;
    validatedLessons: number;
    delayedLessons: number;
    totalPlannedHours: number;
    totalActualHours: number;
  }>;
  
  getAllClassProgressions(academicYear?: string): Promise<(LessonProgression & {
    lesson: Lesson & { chapter: Chapter };
    class: Class & { level: Level };
    teacher: User;
  })[]>;

  // Admin functions
  getAllUsers(): Promise<User[]>;
  createUser(userData: CreateUserData): Promise<User>;
  updateUser(userId: number, userData: UpdateUserData): Promise<User>;
  deleteUser(userId: number): Promise<void>;
  
  getAllSubjects(): Promise<Subject[]>;
  createSubject(subjectData: InsertSubject): Promise<Subject>;
  updateSubject(subjectId: number, subjectData: Partial<InsertSubject>): Promise<Subject>;
  deleteSubject(subjectId: number): Promise<void>;
  
  getAllLevels(): Promise<Level[]>;
  createLevel(levelData: InsertLevel): Promise<Level>;
  getLevel(levelId: number): Promise<Level | undefined>;
  updateLevel(levelId: number, levelData: Partial<InsertLevel>): Promise<Level>;
  deleteLevel(levelId: number): Promise<void>;
  
  getAllClasses(): Promise<(Class & { level: Level })[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(classId: number, classData: Partial<InsertClass>): Promise<Class>;
  deleteClass(classId: number): Promise<void>;
  
  getAllLessons(): Promise<(Lesson & { chapter: Chapter & { subject: Subject; level: Level } })[]>;
  getLesson(lessonId: number): Promise<Lesson | undefined>;
  createLesson(lessonData: InsertLesson): Promise<Lesson>;
  updateLesson(lessonId: number, lessonData: Partial<InsertLesson>): Promise<Lesson>;
  deleteLesson(lessonId: number): Promise<void>;
  
  getAllChapters(): Promise<(Chapter & { subject: Subject; level: Level })[]>;
  
  getChapterElements(chapterId: number): Promise<ChapterElement[]>;
  createChapterElement(elementData: InsertChapterElement): Promise<ChapterElement>;
  updateChapterElement(elementId: number, elementData: Partial<InsertChapterElement>): Promise<ChapterElement>;
  deleteChapterElement(elementId: number): Promise<void>;
  
  // Audit logs
  createAuditLog(logData: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number, offset?: number): Promise<(AuditLog & { user?: User })[]>;
  
  // Notifications
  getUserNotifications(userId: number, limit?: number): Promise<Notification[]>;
  createNotification(notificationData: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  deleteNotification(notificationId: number): Promise<void>;
  
  // Notification generation helpers
  checkDelayedLessons(userId?: number): Promise<void>;
  createValidationNotification(progressionId: number, validatorId: number): Promise<void>;
  createProgressionNotification(progressionId: number, teacherId: number): Promise<void>;
  createReminderNotifications(): Promise<void>;
  
  // Anomaly reports
  getAllAnomalyReports(): Promise<(AnomalyReport & {
    teacher: User;
    lesson?: Lesson;
    class?: Class & { level: Level };
    subject?: Subject;
    reviewer?: User;
  })[]>;
  getAnomalyReportsByTeacher(teacherId: number): Promise<(AnomalyReport & {
    teacher: User;
    lesson?: Lesson;
    class?: Class & { level: Level };
    subject?: Subject;
    reviewer?: User;
  })[]>;
  createAnomalyReport(reportData: InsertAnomalyReport & { teacherId: number }): Promise<AnomalyReport>;
  updateAnomalyReport(reportId: number, updateData: Partial<AnomalyReport>): Promise<AnomalyReport>;
  
  // SG Reports
  getAllSgReports(): Promise<(SgReport & {
    sg: User;
    teacher: User;
    lessonProgression?: LessonProgression & { lesson: Lesson };
    class: Class & { level: Level };
  })[]>;
  getSgReportsBySg(sgId: number): Promise<(SgReport & {
    sg: User;
    teacher: User;
    lessonProgression?: LessonProgression & { lesson: Lesson };
    class: Class & { level: Level };
  })[]>;
  createSgReport(reportData: InsertSgReport & { sgId: number }): Promise<SgReport>;
  updateSgReport(reportId: number, updateData: Partial<SgReport>): Promise<SgReport>;
  
  // SG specific methods - Un SG ne voit que les schema.classes de son cycle
  getTeachersBySgCycle(sgId: number): Promise<User[]>;
  getClassesBySgCycle(sgId: number): Promise<(Class & { level: Level })[]>;
  
  // Rapport de volume horaire pour SG
  getTeacherHoursByMonth(sgId: number, month?: string, year?: string): Promise<{
    teacherId: number;
    teacherName: string;
    subject: string;
    classes: string[];
    plannedHours: number;
    actualHours: number;
    completedLessons: number;
    totalLessons: number;
    monthlyTarget: number;
  }[]>;
  
  // Assignment management methods
  createInspectorAssignment(assignmentData: { inspectorId: number; subjectId: number; academicYear: string }): Promise<InspectorAssignment>;
  createSgAssignment(assignmentData: { sgId: number; cycle: string; academicYear: string }): Promise<any>;
  createTeacherAssignments(teacherId: number, subjectId: number, classIds: number[], academicYear: string): Promise<TeacherAssignment[]>;
  createNewAcademicYear(academicYear: string): Promise<void>;
  createAdvancedAcademicYear(yearName: string, copyOptions: any): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user || undefined;
  }



  async getTeacherAssignments(teacherId: number): Promise<(TeacherAssignment & {
    class: Class & { level: Level };
    subject: Subject;
  })[]> {
    const results = await db
      .select({
        assignment: schema.teacherAssignments,
        class: schema.classes,
        level: schema.levels,
        subject: schema.subjects
      })
      .from(schema.teacherAssignments)
      .innerJoin(schema.classes, eq(schema.teacherAssignments.classId, schema.classes.id))
      .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .innerJoin(schema.subjects, eq(schema.teacherAssignments.subjectId, schema.subjects.id))
      .where(eq(schema.teacherAssignments.teacherId, teacherId));

    return results.map(result => ({
      ...result.assignment,
      class: {
        ...result.class,
        level: result.level
      },
      subject: result.subject
    }));
  }

  async getAllTeacherAssignments(): Promise<(TeacherAssignment & {
    teacher: User;
    class: Class & { level: Level };
    subject: Subject;
  })[]> {
    const results = await db
      .select({
        assignment: schema.teacherAssignments,
        teacher: schema.users,
        class: schema.classes,
        level: schema.levels,
        subject: schema.subjects
      })
      .from(schema.teacherAssignments)
      .innerJoin(schema.users, eq(schema.teacherAssignments.teacherId, schema.users.id))
      .innerJoin(schema.classes, eq(schema.teacherAssignments.classId, schema.classes.id))
      .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .innerJoin(schema.subjects, eq(schema.teacherAssignments.subjectId, schema.subjects.id))
      .where(eq(schema.users.role, 'teacher'));

    return results.map(result => ({
      ...result.assignment,
      teacher: result.teacher,
      class: {
        ...result.class,
        level: result.level
      },
      subject: result.subject
    }));
  }

  async getClassesByTeacher(teacherId: number): Promise<(Class & { level: Level })[]> {
    const assignments = await db
      .select()
      .from(schema.teacherAssignments)
      .innerJoin(schema.classes, eq(schema.teacherAssignments.classId, schema.classes.id))
      .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .where(eq(schema.teacherAssignments.teacherId, teacherId));
    
    return assignments.map(a => ({ ...a.classes, level: a.levels }));
  }

  async getSubjectsByTeacher(teacherId: number): Promise<Subject[]> {
    const assignments = await db
      .select()
      .from(schema.teacherAssignments)
      .innerJoin(schema.subjects, eq(schema.teacherAssignments.subjectId, schema.subjects.id))
      .where(eq(schema.teacherAssignments.teacherId, teacherId));
    
    return assignments.map(a => a.subjects);
  }

  async getLessonsByClassAndSubject(classId: number, subjectId: number): Promise<(Lesson & {
    chapter: Chapter;
    progressions: LessonProgression[];
  })[]> {
    const classData = await db.select().from(schema.classes).where(eq(schema.classes.id, classId)).limit(1);
    if (!classData.length) return [];

    const chaptersData = await db
      .select()
      .from(schema.chapters)
      .where(and(
        eq(schema.chapters.subjectId, subjectId),
        eq(schema.chapters.levelId, classData[0].levelId)
      ))
      .orderBy(asc(schema.chapters.orderIndex));

    const lessonsData = await db
      .select({
        lesson: schema.lessons,
        chapter: schema.chapters
      })
      .from(schema.lessons)
      .innerJoin(schema.chapters, eq(schema.lessons.chapterId, schema.chapters.id))
      .where(and(
        eq(schema.chapters.subjectId, subjectId),
        eq(schema.chapters.levelId, classData[0].levelId)
      ))
      .orderBy(asc(schema.chapters.orderIndex), asc(schema.lessons.orderIndex));

    const progressionsData = await db
      .select()
      .from(schema.lessonProgressions)
      .where(eq(schema.lessonProgressions.classId, classId));

    return lessonsData.map(l => ({
      ...l.lesson,
      chapter: l.chapter,
      progressions: progressionsData.filter(p => p.lessonId === l.lesson.id)
    }));
  }

  async getProgressionsByClass(classId: number): Promise<(LessonProgression & {
    lesson: Lesson & { chapter: Chapter };
    class: Class & { level: Level };
    teacher: User;
  })[]> {
    const results = await db
      .select({
        progression: schema.lessonProgressions,
        lesson: schema.lessons,
        chapter: schema.chapters,
        class: schema.classes,
        level: schema.levels,
        teacher: schema.users
      })
      .from(schema.lessonProgressions)
      .innerJoin(schema.lessons, eq(schema.lessonProgressions.lessonId, schema.lessons.id))
      .innerJoin(schema.chapters, eq(schema.lessons.chapterId, schema.chapters.id))
      .innerJoin(schema.classes, eq(schema.lessonProgressions.classId, schema.classes.id))
      .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .innerJoin(schema.users, eq(schema.lessonProgressions.teacherId, schema.users.id))
      .where(eq(schema.lessonProgressions.classId, classId))
      .orderBy(desc(schema.lessonProgressions.updatedAt));

    return results.map(result => ({
      ...result.progression,
      lesson: {
        ...result.lesson,
        chapter: result.chapter
      },
      class: {
        ...result.class,
        level: result.level
      },
      teacher: result.teacher
    }));
  }

  async markLessonCompleted(data: MarkLessonCompletedData & { teacherId: number }): Promise<LessonProgression> {
    // Check if progression already exists
    const existing = await db
      .select()
      .from(schema.lessonProgressions)
      .where(and(
        eq(schema.lessonProgressions.lessonId, data.lessonId),
        eq(schema.lessonProgressions.classId, data.classId),
        eq(schema.lessonProgressions.teacherId, data.teacherId)
      ))
      .limit(1);

    let progression: LessonProgression;

    if (existing.length > 0) {
      const [updated] = await db
        .update(schema.lessonProgressions)
        .set({
          actualDate: new Date(data.actualDate),
          actualDurationMinutes: data.actualDurationMinutes,
          notes: data.notes,
          sessionType: data.sessionType || 'lesson',
          chapterElements: data.chapterElements ? JSON.stringify(data.chapterElements) : null,
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.lessonProgressions.id, existing[0].id))
        .returning();
      progression = updated;
    } else {
      const [created] = await db
        .insert(schema.lessonProgressions)
        .values({
          lessonId: data.lessonId,
          classId: data.classId,
          teacherId: data.teacherId,
          actualDate: new Date(data.actualDate),
          actualDurationMinutes: data.actualDurationMinutes,
          notes: data.notes,
          sessionType: data.sessionType || 'lesson',
          chapterElements: data.chapterElements ? JSON.stringify(data.chapterElements) : null,
          status: 'completed',
          completedAt: new Date(),
        })
        .returning();
      progression = created;
    }

    // Create notification for inspectors of this subject
    try {
      await this.createProgressionNotification(progression.id, data.teacherId);
    } catch (error) {
      console.error('Error creating progression notification:', error);
    }

    return progression;
  }

  async validateProgression(progressionId: number, validatorId: number): Promise<LessonProgression> {
    const [updated] = await db
      .update(schema.lessonProgressions)
      .set({
        status: 'validated',
        validatedBy: validatorId,
        validatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.lessonProgressions.id, progressionId))
      .returning();
    return updated;
  }

  async getProgressionStats(teacherId?: number): Promise<{
    totalLessons: number;
    completedLessons: number;
    validatedLessons: number;
    delayedLessons: number;
    totalPlannedHours: number;
    totalActualHours: number;
  }> {
    let query = db.select().from(schema.lessonProgressions);
    
    if (teacherId) {
      query = query.where(eq(schema.lessonProgressions.teacherId, teacherId));
    }

    const progressions = await query;
    const now = new Date();

    const stats = {
      totalLessons: progressions.length,
      completedLessons: progressions.filter(p => p.status === 'completed' || p.status === 'validated').length,
      validatedLessons: progressions.filter(p => p.status === 'validated').length,
      delayedLessons: 0,
      totalPlannedHours: 0,
      totalActualHours: 0,
    };

    // Calculate delayed schema.lessons and hours
    for (const progression of progressions) {
      const lesson = await db.select().from(schema.lessons).where(eq(schema.lessons.id, progression.lessonId)).limit(1);
      if (lesson.length > 0) {
        stats.totalPlannedHours += lesson[0].plannedDurationMinutes / 60;
        
        if (progression.actualDurationMinutes) {
          stats.totalActualHours += progression.actualDurationMinutes / 60;
        }

        if (lesson[0].plannedDate && progression.status === 'planned' && lesson[0].plannedDate < now) {
          stats.delayedLessons++;
        }
      }
    }

    return stats;
  }

  async getAllClassProgressions(academicYear: string = '2024-2025'): Promise<(LessonProgression & {
    lesson: Lesson & { chapter: Chapter };
    class: Class & { level: Level };
    teacher: User;
  })[]> {
    // Get the academic year ID first
    const academicYearData = await db
      .select()
      .from(schema.academicYears)
      .where(eq(schema.academicYears.name, academicYear))
      .limit(1);
    
    if (!academicYearData.length) {
      return [];
    }
    
    const academicYearId = academicYearData[0].id;
    
    const results = await db
      .select({
        progression: schema.lessonProgressions,
        lesson: schema.lessons,
        chapter: schema.chapters,
        class: schema.classes,
        level: schema.levels,
        teacher: schema.users
      })
      .from(schema.lessonProgressions)
      .innerJoin(schema.lessons, eq(schema.lessonProgressions.lessonId, schema.lessons.id))
      .innerJoin(schema.chapters, eq(schema.lessons.chapterId, schema.chapters.id))
      .innerJoin(schema.classes, eq(schema.lessonProgressions.classId, schema.classes.id))
      .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .innerJoin(schema.users, eq(schema.lessonProgressions.teacherId, schema.users.id))
      .where(eq(schema.classes.academicYearId, academicYearId))
      .orderBy(desc(schema.lessonProgressions.updatedAt));

    return results.map(result => ({
      ...result.progression,
      lesson: {
        ...result.lesson,
        chapter: result.chapter
      },
      class: {
        ...result.class,
        level: result.level
      },
      teacher: result.teacher
    }));
  }

  // Admin functions
  async getAllUsers(): Promise<any[]> {
    // Récupérer tous les utilisateurs d'abord
    const allUsers = await db.select().from(schema.users).orderBy(schema.users.createdAt);
    
    // Enrichir avec les informations d'assignation
    const usersWithAssignments = await Promise.all(
      allUsers.map(async (user) => {
        let assignedSubject = null;
        let assignedCycle = null;
        let teacherClasses = null;
        
        // Récupérer la matière et les classes pour professeurs
        if (user.role === 'teacher') {
          const teacherAssignment = await db
            .select({ subjectName: schema.subjects.name })
            .from(schema.teacherAssignments)
            .innerJoin(schema.subjects, eq(schema.teacherAssignments.subjectId, schema.subjects.id))
            .where(eq(schema.teacherAssignments.teacherId, user.id))
            .limit(1);
          
          if (teacherAssignment.length > 0) {
            assignedSubject = teacherAssignment[0].subjectName;
          }
          
          // Récupérer les classes détaillées du professeur
          teacherClasses = await db
            .select({ 
              className: schema.classes.name,
              levelName: schema.levels.name,
              levelCode: schema.levels.code,
              levelCategory: schema.levels.category
            })
            .from(schema.teacherAssignments)
            .innerJoin(schema.classes, eq(schema.teacherAssignments.classId, schema.classes.id))
            .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
            .where(eq(schema.teacherAssignments.teacherId, user.id));
          
          if (teacherClasses.length > 0) {
            const cycles = new Set<string>();
            teacherClasses.forEach(tc => {
              const levelCategory = tc.levelCategory;
              if (levelCategory === 'maternelle') {
                cycles.add('Maternelle');
              } else if (levelCategory === 'primaire') {
                cycles.add('Primaire');
              } else if (levelCategory === 'collège') {
                cycles.add('Collège');
              } else if (levelCategory === 'lycee') {
                cycles.add('Lycée');
              }
            });
            
            if (cycles.size > 0) {
              assignedCycle = Array.from(cycles).join(' / ');
            }
          }
        }
        
        // Récupérer la matière pour inspecteurs
        if (user.role === 'inspector') {
          const inspectorAssignment = await db
            .select({ subjectName: schema.subjects.name })
            .from(schema.inspectorAssignments)
            .innerJoin(schema.subjects, eq(schema.inspectorAssignments.subjectId, schema.subjects.id))
            .where(eq(schema.inspectorAssignments.inspectorId, user.id))
            .limit(1);
          
          if (inspectorAssignment.length > 0) {
            assignedSubject = inspectorAssignment[0].subjectName;
          }
        }
        
        // Récupérer le cycle pour SG
        if (user.role === 'sg') {
          const sgAssignment = await db
            .select({ cycle: schema.sgAssignments.cycle })
            .from(schema.sgAssignments)
            .where(eq(schema.sgAssignments.sgId, user.id))
            .limit(1);
          
          if (sgAssignment.length > 0) {
            assignedCycle = sgAssignment[0].cycle;
          }
        }
        
        return {
          ...user,
          assignedSubject,
          assignedCycle,
          teacherClasses: user.role === 'teacher' ? teacherClasses : undefined,
        };
      })
    );
    
    return usersWithAssignments;
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const [user] = await db
      .insert(schema.users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(userId: number, userData: UpdateUserData): Promise<User> {
    const [user] = await db
      .update(schema.users)
      .set(userData)
      .where(eq(schema.users.id, userId))
      .returning();
    return user;
  }

  async deleteUser(userId: number): Promise<void> {
    // Supprimer d'abord toutes les références dans les tables liées
    
    // Supprimer les assignations d'inspecteur
    await db.delete(schema.inspectorAssignments).where(eq(schema.inspectorAssignments.inspectorId, userId));
    
    // Supprimer les assignations de SG
    await db.delete(schema.sgAssignments).where(eq(schema.sgAssignments.sgId, userId));
    
    // Supprimer les assignations de professeur
    await db.delete(schema.teacherAssignments).where(eq(schema.teacherAssignments.teacherId, userId));
    
    // Supprimer les rapports d'anomalie où l'utilisateur est le teacher ou le reviewer
    await db.delete(schema.anomalyReports).where(eq(schema.anomalyReports.teacherId, userId));
    await db.delete(schema.anomalyReports).where(eq(schema.anomalyReports.reviewedBy, userId));
    
    // Supprimer les rapports SG créés par cet utilisateur
    await db.delete(schema.sgReports).where(eq(schema.sgReports.sgId, userId));
    
    // Mettre à jour les progressions validées par cet utilisateur (mettre à null)
    await db
      .update(schema.lessonProgressions)
      .set({ validatedBy: null, validatedAt: null })
      .where(eq(schema.lessonProgressions.validatedBy, userId));
    
    // Supprimer les progressions enseignées par ce professeur
    await db.delete(schema.lessonProgressions).where(eq(schema.lessonProgressions.teacherId, userId));
    
    // Supprimer les schema.notifications de/pour cet utilisateur
    await db.delete(schema.notifications).where(eq(schema.notifications.userId, userId));
    
    // Enfin, supprimer l'utilisateur
    await db.delete(schema.users).where(eq(schema.users.id, userId));
  }

  async updateUserHourlyRate(userId: number, hourlyRate: number): Promise<User> {
    const [user] = await db
      .update(schema.users)
      .set({ hourlyRate: hourlyRate.toString() })
      .where(eq(schema.users.id, userId))
      .returning();
    return user;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(schema.subjects).orderBy(schema.subjects.name);
  }

  async createSubject(subjectData: InsertSubject): Promise<Subject> {
    const [subject] = await db
      .insert(schema.subjects)
      .values(subjectData)
      .returning();
    return subject;
  }

  async updateSubject(subjectId: number, subjectData: Partial<InsertSubject>): Promise<Subject> {
    const [subject] = await db
      .update(schema.subjects)
      .set(subjectData)
      .where(eq(schema.subjects.id, subjectId))
      .returning();
    return subject;
  }

  async deleteSubject(subjectId: number): Promise<void> {
    await db.delete(schema.subjects).where(eq(schema.subjects.id, subjectId));
  }

  async getAllLevels(): Promise<Level[]> {
    const levels = await db.select().from(schema.levels);
    
    // Trier selon l'ordre demandé : Maternelle → Primaire → Collège → Lycée
    return levels.sort((a, b) => {
      const order = {
        'maternelle': 1,
        'primaire': 2,
        'college': 3,
        'lycee': 4
      };
      
      const codeOrder = {
        'PS': 1, 'MS': 2, 'GS': 3,
        'CP': 4, 'CE1': 5, 'CE2': 6, 'CE3': 7, 'CE4': 8, 'CE5': 9, 'CE6': 10,
        '1AC': 11, '2AC': 12, '3AC': 13,
        'TC': 14, 'BAC1': 15, 'BAC2': 16,
        'BAC1_SM': 17, 'BAC1_SP': 18, 'BAC2_SM': 19, 'BAC2_SP': 20
      };
      
      const categoryDiff = (order[a.category] || 99) - (order[b.category] || 99);
      if (categoryDiff !== 0) return categoryDiff;
      
      return (codeOrder[a.code] || 99) - (codeOrder[b.code] || 99);
    });
  }

  async createLevel(levelData: InsertLevel): Promise<Level> {
    const [level] = await db
      .insert(schema.levels)
      .values(levelData)
      .returning();
    return level;
  }

  async getLevel(levelId: number): Promise<Level | undefined> {
    const [level] = await db.select().from(schema.levels).where(eq(schema.levels.id, levelId));
    return level || undefined;
  }

  async updateLevel(levelId: number, levelData: Partial<InsertLevel>): Promise<Level> {
    const [level] = await db
      .update(schema.levels)
      .set(levelData)
      .where(eq(schema.levels.id, levelId))
      .returning();
    return level;
  }

  async deleteLevel(levelId: number): Promise<void> {
    // Check if level has dependencies
    const chaptersUsingLevel = await db
      .select()
      .from(schema.chapters)
      .where(eq(schema.chapters.levelId, levelId));
    
    if (chaptersUsingLevel.length > 0) {
      throw new Error(`Ce niveau ne peut pas être supprimé car il est utilisé par ${chaptersUsingLevel.length} chapitre(s). Supprimez d'abord les chapitres associés.`);
    }
    
    const classesUsingLevel = await db
      .select()
      .from(schema.classes)
      .where(eq(schema.classes.levelId, levelId));
    
    if (classesUsingLevel.length > 0) {
      throw new Error(`Ce niveau ne peut pas être supprimé car il est utilisé par ${classesUsingLevel.length} classe(s). Supprimez d'abord les classes associées.`);
    }
    
    await db.delete(schema.levels).where(eq(schema.levels.id, levelId));
  }

  async getAllClasses(): Promise<(Class & { level: Level })[]> {
    const result = await db
      .select()
      .from(schema.classes)
      .leftJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .orderBy(schema.classes.name);

    return result.map(row => ({
      ...row.classes,
      level: row.levels!
    }));
  }

  async getClass(classId: number): Promise<(Class & { level: Level }) | undefined> {
    const [classItem] = await db
      .select()
      .from(schema.classes)
      .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .where(eq(schema.classes.id, classId));
    
    if (!classItem) return undefined;
    
    return {
      ...classItem.class,
      level: classItem.level,
    };
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [newClass] = await db
      .insert(schema.classes)
      .values(classData)
      .returning();
    return newClass;
  }

  async updateClass(classId: number, classData: Partial<InsertClass>): Promise<Class> {
    const [updatedClass] = await db
      .update(schema.classes)
      .set(classData)
      .where(eq(schema.classes.id, classId))
      .returning();
    return updatedClass;
  }

  async deleteClass(classId: number): Promise<void> {
    await db.delete(schema.classes).where(eq(schema.classes.id, classId));
  }

  async getAllLessons(): Promise<(Lesson & { chapter: Chapter & { subject: Subject; level: Level } })[]> {
    const result = await db
      .select()
      .from(schema.lessons)
      .leftJoin(schema.chapters, eq(schema.lessons.chapterId, schema.chapters.id))
      .leftJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
      .leftJoin(schema.levels, eq(schema.chapters.levelId, schema.levels.id))
      .orderBy(schema.lessons.title);

    return result.map(row => ({
      ...row.lessons,
      chapter: {
        ...row.chapters!,
        subject: row.subjects!,
        level: row.levels!
      }
    }));
  }

  async createLesson(lessonData: InsertLesson): Promise<Lesson> {
    // Calculate the next order index for this chapter
    const existingLessons = await db
      .select({ orderIndex: schema.lessons.orderIndex })
      .from(schema.lessons)
      .where(eq(schema.lessons.chapterId, lessonData.chapterId))
      .orderBy(desc(schema.lessons.orderIndex))
      .limit(1);
    
    const nextOrderIndex = existingLessons.length > 0 ? existingLessons[0].orderIndex + 1 : 1;
    
    const [lesson] = await db
      .insert(schema.lessons)
      .values({
        ...lessonData,
        orderIndex: lessonData.orderIndex || nextOrderIndex
      })
      .returning();
    return lesson;
  }

  async updateLesson(lessonId: number, lessonData: Partial<InsertLesson>): Promise<Lesson> {
    const [lesson] = await db
      .update(schema.lessons)
      .set(lessonData)
      .where(eq(schema.lessons.id, lessonId))
      .returning();
    return lesson;
  }

  async getLesson(lessonId: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(schema.lessons).where(eq(schema.lessons.id, lessonId));
    return lesson || undefined;
  }

  async deleteLesson(lessonId: number): Promise<void> {
    await db.delete(schema.lessons).where(eq(schema.lessons.id, lessonId));
  }

  async getAllChapters(): Promise<(Chapter & { subject: Subject; level: Level })[]> {
    return await db
      .select()
      .from(schema.chapters)
      .leftJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
      .leftJoin(schema.levels, eq(schema.chapters.levelId, schema.levels.id))
      .then(results => results.map(row => ({
        ...row.chapters,
        subject: row.subjects!,
        level: row.levels!
      })));
  }

  async getChapterByNameSubjectLevel(name: string, subjectId: number, levelId: number): Promise<Chapter | undefined> {
    const [chapter] = await db
      .select()
      .from(schema.chapters)
      .where(and(
        eq(schema.chapters.name, name),
        eq(schema.chapters.subjectId, subjectId),
        eq(schema.chapters.levelId, levelId)
      ))
      .limit(1);
    return chapter;
  }

  async createChapter(chapterData: { name: string; subjectId: number; levelId: number; orderIndex: number; trimester: number }): Promise<Chapter> {
    const [chapter] = await db
      .insert(schema.chapters)
      .values(chapterData)
      .returning();
    return chapter;
  }

  async getChapterElements(chapterId: number): Promise<ChapterElement[]> {
    return await db
      .select()
      .from(schema.chapterElements)
      .where(eq(schema.chapterElements.chapterId, chapterId))
      .orderBy(schema.chapterElements.orderIndex);
  }

  async createChapterElement(elementData: InsertChapterElement): Promise<ChapterElement> {
    const [element] = await db
      .insert(schema.chapterElements)
      .values(elementData)
      .returning();
    return element;
  }

  async updateChapterElement(elementId: number, elementData: Partial<InsertChapterElement>): Promise<ChapterElement> {
    const [element] = await db
      .update(schema.chapterElements)
      .set(elementData)
      .where(eq(schema.chapterElements.id, elementId))
      .returning();
    return element;
  }

  async deleteChapterElement(elementId: number): Promise<void> {
    await db.delete(schema.chapterElements).where(eq(schema.chapterElements.id, elementId));
  }

  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db
      .insert(schema.auditLogs)
      .values(logData)
      .returning();
    return log;
  }

  async getAuditLogs(limit: number = 100, offset: number = 0): Promise<(AuditLog & { user?: User })[]> {
    const result = await db
      .select()
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return result.map(row => ({
      ...row.audit_logs,
      user: row.users || undefined
    }));
  }

  // Notifications implementation
  async getUserNotifications(userId: number, limit: number = 20): Promise<Notification[]> {
    const result = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit);
    return result;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(schema.notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(schema.notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(schema.notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(schema.notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, false)));
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(schema.notifications)
      .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, false)));
    
    return parseInt(result[0]?.count || '0');
  }

  async deleteNotification(notificationId: number): Promise<void> {
    await db.delete(schema.notifications).where(eq(schema.notifications.id, notificationId));
  }

  // Notification generation helpers
  async checkDelayedLessons(userId?: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Query pour trouver les leçons en retard
    let query = db
      .select()
      .from(schema.lessons)
      .innerJoin(schema.chapters, eq(schema.lessons.chapterId, schema.chapters.id))
      .innerJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
      .innerJoin(schema.classes, eq(schema.chapters.levelId, schema.classes.levelId))
      .innerJoin(schema.teacherAssignments, and(
        eq(schema.teacherAssignments.classId, schema.classes.id),
        eq(schema.teacherAssignments.subjectId, schema.subjects.id)
      ))
      .leftJoin(schema.lessonProgressions, eq(schema.lessonProgressions.lessonId, schema.lessons.id))
      .where(and(
        sql`${schema.lessons.plannedDate} < ${today}`,
        sql`(${schema.lessonProgressions.status} IS NULL OR ${schema.lessonProgressions.status} = 'planned')`
      ));

    if (userId) {
      query = query.where(eq(schema.teacherAssignments.teacherId, userId));
    }

    const delayedLessons = await query;

    // Créer des schema.notifications pour chaque leçon en retard
    for (const delayed of delayedLessons) {
      const existingNotification = await db
        .select()
        .from(schema.notifications)
        .where(and(
          eq(schema.notifications.userId, delayed.teacher_assignments.teacherId),
          eq(schema.notifications.type, 'delay'),
          eq(schema.notifications.entityId, delayed.lessons.id)
        ))
        .limit(1);

      if (existingNotification.length === 0) {
        await this.createNotification({
          userId: delayed.teacher_assignments.teacherId,
          type: 'delay',
          title: 'Leçon en retard',
          message: `La leçon "${delayed.lessons.title}" était prévue le ${delayed.lessons.plannedDate?.toLocaleDateString('fr-FR')} et n'a pas encore été effectuée.`,
          entityType: 'lesson',
          entityId: delayed.lessons.id,
          priority: 'high'
        });
      }
    }
  }

  async createValidationNotification(progressionId: number, validatorId: number): Promise<void> {
    const progression = await db
      .select()
      .from(schema.lessonProgressions)
      .innerJoin(schema.lessons, eq(schema.lessonProgressions.lessonId, schema.lessons.id))
      .innerJoin(schema.users, eq(schema.lessonProgressions.teacherId, schema.users.id))
      .where(eq(schema.lessonProgressions.id, progressionId))
      .limit(1);

    if (progression.length > 0) {
      const prog = progression[0];
      await this.createNotification({
        userId: prog.lesson_progressions.teacherId,
        type: 'validation',
        title: 'Leçon validée',
        message: `Votre leçon "${prog.lessons.title}" a été validée par l'inspecteur.`,
        entityType: 'progression',
        entityId: progressionId,
        priority: 'normal'
      });
    }
  }

  async createProgressionNotification(progressionId: number, teacherId: number): Promise<void> {
    // Get progression details with lesson and subject info
    const progressionData = await db
      .select({
        progression: schema.lessonProgressions,
        lesson: schema.lessons,
        chapter: schema.chapters,
        class: schema.classes,
        teacher: schema.users,
      })
      .from(schema.lessonProgressions)
      .innerJoin(schema.lessons, eq(schema.lessonProgressions.lessonId, schema.lessons.id))
      .innerJoin(schema.chapters, eq(schema.lessons.chapterId, schema.chapters.id))
      .innerJoin(schema.classes, eq(schema.lessonProgressions.classId, schema.classes.id))
      .innerJoin(schema.users, eq(schema.lessonProgressions.teacherId, schema.users.id))
      .where(eq(schema.lessonProgressions.id, progressionId))
      .limit(1);

    if (progressionData.length === 0) return;

    const { progression, lesson, chapter, class: classData, teacher } = progressionData[0];

    // Find inspectors responsible for this subject
    const inspectors = await db
      .select({
        inspector: schema.users,
        assignment: schema.inspectorAssignments,
      })
      .from(schema.inspectorAssignments)
      .innerJoin(schema.users, eq(schema.inspectorAssignments.inspectorId, schema.users.id))
      .where(eq(schema.inspectorAssignments.subjectId, chapter.subjectId));

    console.log('DEBUG: Creating notifications for inspectors:', inspectors.length);

    // Create notification for each inspector
    for (const inspectorData of inspectors) {
      console.log('DEBUG: Creating notification for inspector:', inspectorData.inspector.id);
      await this.createNotification({
        userId: inspectorData.inspector.id,
        type: 'progression_completed',
        title: 'Nouvelle progression à valider',
        message: `${teacher.firstName} ${teacher.lastName} a complété la leçon "${lesson.title}" (${classData.name})`,
        entityType: 'progression',
        entityId: progressionId,
        priority: 'high',
      });
    }
  }

  async createReminderNotifications(): Promise<void> {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Trouver les leçons prévues dans la semaine prochaine qui ne sont pas encore effectuées
    const upcomingLessons = await db
      .select()
      .from(schema.lessons)
      .innerJoin(schema.chapters, eq(schema.lessons.chapterId, schema.chapters.id))
      .innerJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
      .innerJoin(schema.classes, eq(schema.chapters.levelId, schema.classes.levelId))
      .innerJoin(schema.teacherAssignments, and(
        eq(schema.teacherAssignments.classId, schema.classes.id),
        eq(schema.teacherAssignments.subjectId, schema.subjects.id)
      ))
      .leftJoin(schema.lessonProgressions, eq(schema.lessonProgressions.lessonId, schema.lessons.id))
      .where(and(
        sql`${schema.lessons.plannedDate} BETWEEN ${new Date()} AND ${nextWeek}`,
        sql`(${schema.lessonProgressions.status} IS NULL OR ${schema.lessonProgressions.status} = 'planned')`
      ));

    for (const upcoming of upcomingLessons) {
      const existingReminder = await db
        .select()
        .from(schema.notifications)
        .where(and(
          eq(schema.notifications.userId, upcoming.teacher_assignments.teacherId),
          eq(schema.notifications.type, 'reminder'),
          eq(schema.notifications.entityId, upcoming.lessons.id)
        ))
        .limit(1);

      if (existingReminder.length === 0) {
        await this.createNotification({
          userId: upcoming.teacher_assignments.teacherId,
          type: 'reminder',
          title: 'Rappel de leçon',
          message: `N'oubliez pas la leçon "${upcoming.lessons.title}" prévue le ${upcoming.lessons.plannedDate?.toLocaleDateString('fr-FR')}.`,
          entityType: 'lesson',
          entityId: upcoming.lessons.id,
          priority: 'low'
        });
      }
    }
  }

  // Anomaly Reports methods
  async getAllAnomalyReports(): Promise<(AnomalyReport & {
    teacher: User;
    lesson?: Lesson;
    class?: Class & { level: Level };
    subject?: Subject;
    reviewer?: User;
  })[]> {
    const reports = await db
      .select({
        report: schema.anomalyReports,
        teacher: schema.users,
        lesson: schema.lessons,
        class: schema.classes,
        level: schema.levels,
        subject: schema.subjects,
      })
      .from(schema.anomalyReports)
      .innerJoin(schema.users, eq(schema.anomalyReports.teacherId, schema.users.id))
      .leftJoin(schema.lessons, eq(schema.anomalyReports.lessonId, schema.lessons.id))
      .leftJoin(schema.classes, eq(schema.anomalyReports.classId, schema.classes.id))
      .leftJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .leftJoin(schema.subjects, eq(schema.anomalyReports.subjectId, schema.subjects.id))
      .orderBy(desc(schema.anomalyReports.createdAt));

    return reports.map(row => ({
      ...row.report,
      teacher: row.teacher,
      lesson: row.lesson || undefined,
      class: row.class && row.level ? { ...row.class, level: row.level } : undefined,
      subject: row.subject || undefined,
      reviewer: undefined, // Sera ajouté dans une requête séparée si nécessaire
    }));
  }

  async getAnomalyReportsByTeacher(teacherId: number): Promise<(AnomalyReport & {
    teacher: User;
    lesson?: Lesson;
    class?: Class & { level: Level };
    subject?: Subject;
    reviewer?: User;
  })[]> {
    const reports = await db
      .select()
      .from(schema.anomalyReports)
      .leftJoin(schema.users, eq(schema.anomalyReports.teacherId, schema.users.id))
      .leftJoin(schema.lessons, eq(schema.anomalyReports.lessonId, schema.lessons.id))
      .leftJoin(schema.classes, eq(schema.anomalyReports.classId, schema.classes.id))
      .leftJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .leftJoin(schema.subjects, eq(schema.anomalyReports.subjectId, schema.subjects.id))
      .leftJoin(schema.users, eq(schema.anomalyReports.reviewedBy, schema.users.id))
      .where(eq(schema.anomalyReports.teacherId, teacherId))
      .orderBy(desc(schema.anomalyReports.createdAt));

    return reports.map(row => ({
      ...row.anomaly_reports,
      teacher: row.users!,
      lesson: row.lessons || undefined,
      class: row.classes ? { ...row.classes, level: row.levels! } : undefined,
      subject: row.subjects || undefined,
      reviewer: row.users || undefined,
    }));
  }

  async createAnomalyReport(reportData: InsertAnomalyReport & { teacherId: number }): Promise<AnomalyReport> {
    const [report] = await db
      .insert(schema.anomalyReports)
      .values(reportData)
      .returning();
    return report;
  }

  async updateAnomalyReport(reportId: number, updateData: Partial<AnomalyReport>): Promise<AnomalyReport> {
    const [report] = await db
      .update(schema.anomalyReports)
      .set(updateData)
      .where(eq(schema.anomalyReports.id, reportId))
      .returning();
    return report;
  }

  // SG Reports methods
  async getAllSgReports(): Promise<(SgReport & {
    sg: User;
    teacher: User;
    lessonProgression?: LessonProgression & { lesson: Lesson };
    class: Class & { level: Level };
  })[]> {
    const reports = await db
      .select()
      .from(schema.sgReports)
      .orderBy(desc(schema.sgReports.createdAt));

    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const [sg, teacher, clazz, lessonProgression] = await Promise.all([
          this.getUser(report.sgId),
          this.getUser(report.teacherId),
          report.classId ? this.getClass(report.classId) : null,
          report.lessonProgressionId ? this.getLessonProgression(report.lessonProgressionId) : null,
        ]);

        return {
          ...report,
          sg: sg!,
          teacher: teacher!,
          class: clazz!,
          lessonProgression: lessonProgression || undefined,
        };
      })
    );

    return enrichedReports;
  }

  async getSgReportsBySg(sgId: number): Promise<(SgReport & {
    sg: User;
    teacher: User;
    lessonProgression?: LessonProgression & { lesson: Lesson };
    class: Class & { level: Level };
  })[]> {
    const reports = await db
      .select()
      .from(schema.sgReports)
      .where(eq(schema.sgReports.sgId, sgId))
      .orderBy(desc(schema.sgReports.createdAt));

    const enrichedReports = await Promise.all(
      reports.map(async (report) => {
        const [sg, teacher, clazz, lessonProgression] = await Promise.all([
          this.getUser(report.sgId),
          this.getUser(report.teacherId),
          report.classId ? this.getClass(report.classId) : null,
          report.lessonProgressionId ? this.getLessonProgression(report.lessonProgressionId) : null,
        ]);

        return {
          ...report,
          sg: sg!,
          teacher: teacher!,
          class: clazz!,
          lessonProgression: lessonProgression || undefined,
        };
      })
    );

    return enrichedReports;
  }

  async createSgReport(reportData: InsertSgReport & { sgId: number }): Promise<SgReport> {
    const [report] = await db
      .insert(schema.sgReports)
      .values(reportData)
      .returning();
    return report;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const users = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, role));
    return users;
  }

  async getLessonProgression(progressionId: number): Promise<(LessonProgression & { lesson: Lesson }) | undefined> {
    const [progression] = await db
      .select()
      .from(schema.lessonProgressions)
      .innerJoin(schema.lessons, eq(schema.lessonProgressions.lessonId, schema.lessons.id))
      .where(eq(schema.lessonProgressions.id, progressionId));
    
    if (!progression) return undefined;
    
    return {
      ...progression.lesson_progressions,
      lesson: progression.lesson,
    };
  }

  async updateSgReport(reportId: number, updateData: Partial<SgReport>): Promise<SgReport> {
    const [report] = await db
      .update(schema.sgReports)
      .set(updateData)
      .where(eq(schema.sgReports.id, reportId))
      .returning();
    return report;
  }

  async getSgReportById(reportId: number): Promise<SgReport | undefined> {
    const [report] = await db
      .select()
      .from(schema.sgReports)
      .where(eq(schema.sgReports.id, reportId));
    return report;
  }

  // Inspector specific methods
  async getTeachersByInspectorSubject(inspectorId: number, academicYear: string = '2024-2025'): Promise<(User & {
    assignments: (TeacherAssignment & { class: Class & { level: Level }; subject: Subject })[];
  })[]> {
    console.log('DEBUG: Getting teachers for inspector ID:', inspectorId, 'Academic Year:', academicYear);
    
    // Get inspector's subjects for the academic year
    const inspectorSubjects = await db
      .select()
      .from(schema.inspectorAssignments)
      .where(eq(schema.inspectorAssignments.inspectorId, inspectorId));

    console.log('DEBUG: Inspector subjects:', inspectorSubjects);

    if (inspectorSubjects.length === 0) {
      console.log('DEBUG: No subjects assigned to inspector for this academic year');
      return [];
    }

    const subjectIds = inspectorSubjects.map(ia => ia.subjectId);
    console.log('DEBUG: Subject IDs:', subjectIds);

    // Get teachers assigned to these schema.subjects for the academic year
    const teacherData = await db
      .select({
        teacherAssignment: schema.teacherAssignments,
        user: schema.users,
        class: schema.classes,
        level: schema.levels,
        subject: schema.subjects
      })
      .from(schema.teacherAssignments)
      .innerJoin(schema.users, eq(schema.teacherAssignments.teacherId, schema.users.id))
      .innerJoin(schema.classes, eq(schema.teacherAssignments.classId, schema.classes.id))
      .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .innerJoin(schema.subjects, eq(schema.teacherAssignments.subjectId, schema.subjects.id))
      .where(inArray(schema.teacherAssignments.subjectId, subjectIds));

    console.log('DEBUG: Raw teacher data:', teacherData.length, 'records');
    if (teacherData.length > 0) {
      console.log('DEBUG: First record:', JSON.stringify(teacherData[0], null, 2));
    }

    // Group by teacher
    const teacherMap = new Map<number, User & {
      assignments: (TeacherAssignment & { class: Class & { level: Level }; subject: Subject })[];
    }>();

    teacherData.forEach(row => {
      const teacherId = row.user.id;
      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, {
          ...row.user,
          assignments: []
        });
      }
      teacherMap.get(teacherId)!.assignments.push({
        ...row.teacherAssignment,
        class: { ...row.class, level: row.level },
        subject: row.subject
      });
    });

    const result = Array.from(teacherMap.values());
    console.log('DEBUG: Final result:', result.length, 'teachers');
    console.log('DEBUG: Teachers:', result.map(t => ({ 
      id: t.id, 
      name: `${t.firstName} ${t.lastName}`, 
      assignments: t.assignments.length 
    })));

    return result;
  }

  // SG specific methods
  async getTeachersBySgCycle(sgId: number): Promise<(User & {
    subject?: Subject;
    classes?: string[];
  })[]> {
    try {
      // Get SG's assigned cycle
      const sgCycles = await db
        .select()
        .from(schema.sgAssignments)
        .where(eq(schema.sgAssignments.sgId, sgId));

      if (sgCycles.length === 0) {
        return [];
      }

      const cycles = sgCycles.map((sa: any) => sa.cycle);

      // Get all teacher assignments with their classes and levels
      const teacherAssignmentsData = await db
        .select({
          teacher: schema.users,
          subject: schema.subjects,
          class: schema.classes,
          level: schema.levels,
          assignment: schema.teacherAssignments,
        })
        .from(schema.teacherAssignments)
        .innerJoin(schema.users, eq(schema.teacherAssignments.teacherId, schema.users.id))
        .innerJoin(schema.subjects, eq(schema.teacherAssignments.subjectId, schema.subjects.id))
        .innerJoin(schema.classes, eq(schema.teacherAssignments.classId, schema.classes.id))
        .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
        .where(eq(schema.users.role, 'teacher'));

      // Filter teachers by cycle using the category column directly
      const filteredAssignments = teacherAssignmentsData.filter((assignment: any) => {
        // Use the category column directly instead of getCycleFromLevel
        const classCycle = assignment.level.category;
        return cycles.includes(classCycle);
      });

      // Group by teacher
      const teacherMap = new Map<number, User & {
        subject?: Subject;
        classes?: string[];
      }>();

      filteredAssignments.forEach(row => {
        const teacherId = row.teacher.id;
        if (!teacherMap.has(teacherId)) {
          teacherMap.set(teacherId, {
            ...row.teacher,
            subject: row.subject,
            classes: []
          });
        }
        teacherMap.get(teacherId)!.classes!.push(`${row.class.name} (${row.level.name})`);
      });

      return Array.from(teacherMap.values());
    } catch (error) {
      console.error('Erreur lors de la récupération des professeurs par cycle SG:', error);
      return [];
    }
  }

  async getClassesBySgCycle(sgId: number): Promise<(Class & { level: Level })[]> {
    // Get SG's assigned cycle
    const sgCycles = await db
      .select()
      .from(schema.sgAssignments)
      .where(eq(schema.sgAssignments.sgId, sgId));

    if (sgCycles.length === 0) {
      return [];
    }

    const cycles = sgCycles.map((sa: any) => sa.cycle);

    // Get all schema.classes with their schema.levels
    const allClassData = await db
      .select()
      .from(schema.classes)
      .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id));

    // Filter schema.classes by cycle using the utility function
    const filteredClasses = allClassData.filter((row: any) => {
      const classCycle = getCycleFromLevel(row.levels.name);
      return cycles.includes(classCycle);
    });

    return filteredClasses.map((row: any) => ({
      ...row.classes,
      level: row.levels
    }));
  }

  async getTeacherHoursByMonth(sgId: number, month?: string, year?: string): Promise<{
    teacherId: number;
    teacherName: string;
    subject: string;
    classes: string[];
    plannedHours: number;
    actualHours: number;
    completedLessons: number;
    totalLessons: number;
    monthlyTarget: number;
  }[]> {
    // Get SG's cycle to filter teachers by cycle
    const sgCycles = await db
      .select()
      .from(schema.sgAssignments)
      .where(eq(schema.sgAssignments.sgId, sgId));

    if (sgCycles.length === 0) {
      return [];
    }

    const cycles = sgCycles.map((sa: any) => sa.cycle);

    // Get all teacher assignments with their schema.classes and schema.levels
    const teacherAssignmentsData = await db
      .select({
        teacher: schema.users,
        subject: schema.subjects,
        class: schema.classes,
        level: schema.levels,
        assignment: schema.teacherAssignments,
      })
      .from(schema.teacherAssignments)
      .innerJoin(schema.users, eq(schema.teacherAssignments.teacherId, schema.users.id))
      .innerJoin(schema.subjects, eq(schema.teacherAssignments.subjectId, schema.subjects.id))
      .innerJoin(schema.classes, eq(schema.teacherAssignments.classId, schema.classes.id))
      .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .where(eq(schema.users.role, 'teacher'));

    // Filter teachers by cycle using the utility function
    const filteredAssignments = teacherAssignmentsData.filter((assignment: any) => {
      const classCycle = getCycleFromLevel(assignment.level.name);
      return cycles.includes(classCycle);
    });

    // Group by teacher and calculate hours
    const teacherGroups = filteredAssignments.reduce((acc: any, row: any) => {
      const teacherId = row.teacher.id;
      
      if (!acc[teacherId]) {
        acc[teacherId] = {
          teacher: row.teacher,
          subject: row.subject.name,
          classes: [],
          subjectId: row.subject.id,
        };
      }
      
      acc[teacherId].classes.push(`${row.class.name} (${row.level.name})`);
      
      return acc;
    }, {});

    // Calculate hours for each teacher
    const results = await Promise.all(
      Object.values(teacherGroups).map(async (group: any) => {
        // Get progressions for this teacher with actual hours
        const progressionsData = await db
          .select({
            progression: schema.lessonProgressions,
            lesson: schema.lessons,
          })
          .from(schema.lessonProgressions)
          .innerJoin(schema.lessons, eq(schema.lessonProgressions.lessonId, schema.lessons.id))
          .innerJoin(schema.chapters, eq(schema.lessons.chapterId, schema.chapters.id))
          .where(
            and(
              eq(schema.lessonProgressions.teacherId, group.teacher.id),
              eq(schema.chapters.subjectId, group.subjectId)
            )
          );

        // Get all schema.lessons for this teacher's subject (for total count)
        const allLessonsData = await db
          .select()
          .from(schema.lessons)
          .innerJoin(schema.chapters, eq(schema.lessons.chapterId, schema.chapters.id))
          .where(eq(schema.chapters.subjectId, group.subjectId));

        const totalLessons = allLessonsData.length;
        const completedLessons = progressionsData.filter((p: any) => p.progression.completedAt).length;
        
        const plannedHours = progressionsData.reduce((sum: number, p: any) => 
          sum + (p.lesson.plannedDurationMinutes || 0), 0) / 60;
        const actualHours = progressionsData.reduce((sum: number, p: any) => 
          sum + (p.progression.actualDurationMinutes || 0), 0) / 60;

        return {
          teacherId: group.teacher.id as number,
          teacherName: `${group.teacher.firstName} ${group.teacher.lastName}` as string,
          subject: group.subject as string,
          classes: Array.from(new Set(group.classes)) as string[], // Remove duplicates
          plannedHours: Math.round(plannedHours * 100) / 100,
          actualHours: Math.round(actualHours * 100) / 100,
          completedLessons,
          totalLessons,
          monthlyTarget: 80, // Standard monthly target hours
        };
      })
    );

    return results;
  }

  async getProgressionsByTeacher(teacherId: number): Promise<(LessonProgression & {
    lesson: Lesson & { chapter: Chapter };
    class: Class & { level: Level };
  })[]> {
    const results = await db
      .select()
      .from(schema.lessonProgressions)
      .innerJoin(schema.lessons, eq(schema.lessonProgressions.lessonId, schema.lessons.id))
      .innerJoin(schema.chapters, eq(schema.lessons.chapterId, schema.chapters.id))
      .innerJoin(schema.classes, eq(schema.lessonProgressions.classId, schema.classes.id))
      .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .where(eq(schema.lessonProgressions.teacherId, teacherId))
      .orderBy(desc(schema.lessonProgressions.updatedAt));

    return results.map(result => ({
      ...result.lesson_progressions,
      lesson: {
        ...result.lesson,
        chapter: result.chapter
      },
      class: {
        ...result.class,
        level: result.level
      }
    }));
  }

  async getProgressionsByTeacherAndClass(teacherId: number, classId: number): Promise<(LessonProgression & {
    lesson: Lesson & { chapter: Chapter };
    class: Class & { level: Level };
  })[]> {
    const results = await db
      .select()
      .from(schema.lessonProgressions)
      .innerJoin(schema.lessons, eq(schema.lessonProgressions.lessonId, schema.lessons.id))
      .innerJoin(schema.chapters, eq(schema.lessons.chapterId, schema.chapters.id))
      .innerJoin(schema.classes, eq(schema.lessonProgressions.classId, schema.classes.id))
      .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .where(and(
        eq(schema.lessonProgressions.teacherId, teacherId),
        eq(schema.lessonProgressions.classId, classId)
      ))
      .orderBy(desc(schema.lessonProgressions.updatedAt));

    return results.map(result => ({
      ...result.lesson_progressions,
      lesson: {
        ...result.lesson,
        chapter: result.chapter
      },
      class: {
        ...result.class,
        level: result.level
      }
    }));
  }

  async createInspectorAssignment(assignmentData: { inspectorId: number; subjectId: number; academicYear: string }): Promise<InspectorAssignment> {
    // Get the academic year ID from the name
    const academicYear = await db
      .select()
      .from(schema.academicYears)
      .where(eq(schema.academicYears.name, assignmentData.academicYear))
      .limit(1);
    
    const academicYearId = academicYear.length > 0 ? academicYear[0].id : 1; // Default to first year if not found
    
    const [assignment] = await db
      .insert(schema.inspectorAssignments)
      .values({
        inspectorId: assignmentData.inspectorId,
        subjectId: assignmentData.subjectId,
        academicYearId: academicYearId
      })
      .returning();
    return assignment;
  }

  async createSgAssignment(assignmentData: { sgId: number; cycle: string; academicYear: string }): Promise<any> {
    const [assignment] = await db
      .insert(schema.sgAssignments)
      .values(assignmentData)
      .returning();
    return assignment;
  }

  async createTeacherAssignments(teacherId: number, subjectId: number, classIds: number[], academicYear: string): Promise<TeacherAssignment[]> {
    const assignmentData = classIds.map(classId => ({
      teacherId,
      subjectId,
      classId,
      academicYear
    }));

    const assignments = await db
      .insert(schema.teacherAssignments)
      .values(assignmentData)
      .returning();
    
    return assignments;
  }

  async createNewAcademicYear(academicYear: string): Promise<void> {
    try {
      // 1. Récupérer toutes les classes de l'année précédente
      const previousClasses = await db
        .select()
        .from(schema.classes)
        .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
        .where(eq(schema.classes.academicYear, '2024-2025')); // Prendre l'année de référence

      // 2. Créer les nouvelles classes pour la nouvelle année
      const newClassesData = previousClasses.map(classData => ({
        name: classData.classes.name,
        levelId: classData.classes.levelId,
        academicYear: academicYear
      }));

      const newClasses = await db
        .insert(schema.classes)
        .values(newClassesData)
        .returning();

      console.log(`Created ${newClasses.length} classes for academic year ${academicYear}`);

      // 3. Optionnel : Copier les assignations des professeurs/inspecteurs/SG
      // On peut laisser l'admin les refaire manuellement pour plus de contrôle
      
    } catch (error) {
      console.error('Error creating new academic year:', error);
      throw error;
    }
  }

  async createAdvancedAcademicYear(yearName: string, copyOptions: any): Promise<void> {
    try {
      console.log(`Creating advanced academic year ${yearName} with options:`, copyOptions);
      
      // 1. Copier les classes si demandé
      if (copyOptions.classes) {
        const previousClasses = await db
          .select()
          .from(schema.classes)
          .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
          .where(eq(schema.classes.academicYear, '2024-2025')); // Année de référence

        const newClassesData = previousClasses.map(classData => ({
          name: classData.classes.name,
          levelId: classData.classes.levelId,
          academicYear: yearName
        }));

        const newClasses = await db
          .insert(schema.classes)
          .values(newClassesData)
          .returning();

        console.log(`Created ${newClasses.length} classes for ${yearName}`);
      }

      // 2. Copier les assignations d'inspecteurs si demandé
      if (copyOptions.inspectorAssignments) {
        const previousInspectorAssignments = await db
          .select()
          .from(schema.inspectorAssignments)
          .where(eq(schema.inspectorAssignments.academicYear, '2024-2025'));

        if (previousInspectorAssignments.length > 0) {
          const newInspectorAssignments = previousInspectorAssignments.map(assignment => ({
            inspectorId: assignment.inspectorId,
            subjectId: assignment.subjectId,
            academicYear: yearName
          }));

          await db
            .insert(schema.inspectorAssignments)
            .values(newInspectorAssignments);

          console.log(`Created ${newInspectorAssignments.length} inspector assignments for ${yearName}`);
        }
      }

      // 3. Copier les assignations SG si demandé
      if (copyOptions.sgAssignments) {
        const previousSgAssignments = await db
          .select()
          .from(schema.sgAssignments)
          .where(eq(schema.sgAssignments.academicYear, '2024-2025'));

        if (previousSgAssignments.length > 0) {
          const newSgAssignments = previousSgAssignments.map(assignment => ({
            sgId: assignment.sgId,
            cycle: assignment.cycle,
            academicYear: yearName
          }));

          await db
            .insert(schema.sgAssignments)
            .values(newSgAssignments);

          console.log(`Created ${newSgAssignments.length} SG assignments for ${yearName}`);
        }
      }

      console.log(`Academic year ${yearName} created successfully`);
      
    } catch (error) {
      console.error('Error creating advanced academic year:', error);
      throw error;
    }
  }

  // Inspector specific methods - new implementations
  async getInspectorSubjects(inspectorId: number, academicYear: string = '2024-2025'): Promise<InspectorAssignment[]> {
    // Get the academic year ID first
    const academicYearData = await db
      .select()
      .from(schema.academicYears)
      .where(eq(schema.academicYears.name, academicYear))
      .limit(1);
    
    if (!academicYearData.length) {
      return [];
    }
    
    const academicYearId = academicYearData[0].id;
    
    const subjects = await db
      .select()
      .from(schema.inspectorAssignments)
      .where(and(
        eq(schema.inspectorAssignments.inspectorId, inspectorId),
        eq(schema.inspectorAssignments.academicYearId, academicYearId)
      ));
    
    return subjects;
  }

  async getInspectorProgressions(inspectorId: number): Promise<(LessonProgression & {
    lesson: Lesson & { chapter: Chapter };
    class: Class & { level: Level };
    teacher: User;
  })[]> {
    // Get inspector's assigned subjects
    const inspectorSubjects = await this.getInspectorSubjects(inspectorId);
    if (!inspectorSubjects.length) {
      return [];
    }

    const subjectIds = inspectorSubjects.map(assignment => assignment.subjectId);

    // Get all progressions for these subjects
    const results = await db
      .select({
        lessonProgression: schema.lessonProgressions,
        lesson: schema.lessons,
        chapter: schema.chapters,
        class: schema.classes,
        level: schema.levels,
        teacher: schema.users,
      })
      .from(schema.lessonProgressions)
      .innerJoin(schema.lessons, eq(schema.lessonProgressions.lessonId, schema.lessons.id))
      .innerJoin(schema.chapters, eq(schema.lessons.chapterId, schema.chapters.id))
      .innerJoin(schema.classes, eq(schema.lessonProgressions.classId, schema.classes.id))
      .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .innerJoin(schema.users, eq(schema.lessonProgressions.teacherId, schema.users.id))
      .where(inArray(schema.chapters.subjectId, subjectIds))
      .orderBy(desc(schema.lessonProgressions.createdAt));

    return results.map(row => ({
      ...row.lessonProgression,
      lesson: { ...row.lesson, chapter: row.chapter },
      class: { ...row.class, level: row.level },
      teacher: row.teacher,
    }));
  }

  async getInspectorProgressionsByTeacher(teacherId: number, subjectIds: number[]): Promise<(LessonProgression & {
    lesson: Lesson & { chapter: Chapter };
    class: Class & { level: Level };
    teacher: User;
  })[]> {
    // Get all progressions for the teacher first
    const allProgressions = await db
      .select({
        lessonProgression: schema.lessonProgressions,
        lesson: schema.lessons,
        chapter: schema.chapters,
        class: schema.classes,
        level: schema.levels,
        teacher: schema.users,
      })
      .from(schema.lessonProgressions)
      .innerJoin(schema.lessons, eq(schema.lessonProgressions.lessonId, schema.lessons.id))
      .innerJoin(schema.chapters, eq(schema.lessons.chapterId, schema.chapters.id))
      .innerJoin(schema.classes, eq(schema.lessonProgressions.classId, schema.classes.id))
      .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .innerJoin(schema.users, eq(schema.lessonProgressions.teacherId, schema.users.id))
      .where(eq(schema.lessonProgressions.teacherId, teacherId))
      .orderBy(desc(schema.lessonProgressions.createdAt));

    // Filter by subject IDs in JavaScript
    const results = allProgressions.filter(row => 
      subjectIds.includes(row.chapter.subjectId)
    );

    return results.map(row => ({
      ...row.lessonProgression,
      lesson: { ...row.lesson, chapter: row.chapter },
      class: { ...row.class, level: row.level },
      teacher: row.teacher,
    }));
  }

  async getInspectorProgressionsByTeacherAndClass(teacherId: number, classId: number, subjectIds: number[]): Promise<(LessonProgression & {
    lesson: Lesson & { chapter: Chapter };
    class: Class & { level: Level };
    teacher: User;
  })[]> {
    const results = await db
      .select({
        lessonProgression: schema.lessonProgressions,
        lesson: schema.lessons,
        chapter: schema.chapters,
        class: schema.classes,
        level: schema.levels,
        teacher: schema.users,
      })
      .from(schema.lessonProgressions)
      .innerJoin(schema.lessons, eq(schema.lessonProgressions.lessonId, schema.lessons.id))
      .innerJoin(schema.chapters, eq(schema.lessons.chapterId, schema.chapters.id))
      .innerJoin(schema.classes, eq(schema.lessonProgressions.classId, schema.classes.id))
      .innerJoin(schema.levels, eq(schema.classes.levelId, schema.levels.id))
      .innerJoin(schema.users, eq(schema.lessonProgressions.teacherId, schema.users.id))
      .where(
        and(
          eq(schema.lessonProgressions.teacherId, teacherId),
          eq(schema.lessonProgressions.classId, classId)
        )
      )
      .orderBy(desc(schema.lessonProgressions.createdAt));

    // Filter by subject IDs in JavaScript
    const filteredResults = results.filter(row => 
      subjectIds.includes(row.chapter.subjectId)
    );

    return filteredResults.map(row => ({
      ...row.lessonProgression,
      lesson: { ...row.lesson, chapter: row.chapter },
      class: { ...row.class, level: row.level },
      teacher: row.teacher,
    }));
  }
}

export const storage = new DatabaseStorage();
