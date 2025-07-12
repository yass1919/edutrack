import type { Express, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, markLessonCompletedSchema, createUserSchema, updateUserSchema, insertSubjectSchema, insertClassSchema, insertLessonSchema, insertAnomalyReportSchema, frontendAnomalyReportSchema, insertSgReportSchema, updateClassSchema } from "@shared/schema";
import { z } from "zod";
import { authStore, requireAuth } from "./index";
import { db } from "./db";
import { classes } from "@shared/schema";
import * as schema from "@shared/schema";
import { desc } from "drizzle-orm";
import bcrypt from "bcrypt";

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect" });
      }

      // Vérifier le mot de passe avec bcrypt
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect" });
      }

      // Generate token and store user association
      const token = generateToken();
      authStore.set(token, user.id);
      console.log("Token generated:", token, "for userId:", user.id);
      
      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        token: token
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Données invalides" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Ce nom d'utilisateur est déjà utilisé" });
      }
      
      // Hash the password before storing
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create new user
      const newUser = await storage.createUser({
        username: userData.username,
        password: hashedPassword,
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
      });
      
      res.status(201).json({
        message: "Compte créé avec succès",
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
        }
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Données invalides" });
      }
      res.status(500).json({ message: "Erreur lors de la création du compte" });
    }
  });

  app.post("/api/auth/logout", (req: any, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (authStore.has(token)) {
        authStore.delete(token);
        console.log("Token deleted:", token);
      }
    }
    res.json({ message: "Déconnecté avec succès" });
  });

  app.get("/api/auth/me", requireAuth, async (req: any, res) => {
    const userId = req.userId;
    console.log("Auth check - userId:", userId);

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
  });

  // Teacher routes
  app.get("/api/teacher/assignments", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const assignments = await storage.getTeacherAssignments(userId);
      res.json(assignments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/teacher/stats", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const stats = await storage.getProgressionStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/teacher/assignments", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const assignments = await storage.getTeacherAssignments(userId);
      res.json(assignments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/teacher/lessons", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { classId, subjectId } = req.query;
      
      if (!classId || !subjectId) {
        return res.status(400).json({ message: "classId et subjectId sont requis" });
      }

      const lessons = await storage.getLessonsByClassAndSubject(
        parseInt(classId as string),
        parseInt(subjectId as string)
      );
      res.json(lessons);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/teacher/chapter-elements/:chapterId", requireAuth, async (req: any, res) => {
    try {
      const chapterId = parseInt(req.params.chapterId);
      if (!chapterId) {
        return res.status(400).json({ message: "ID chapitre invalide" });
      }

      const elements = await storage.getChapterElements(chapterId);
      res.json(elements);
    } catch (error: any) {
      console.error("Error fetching chapter elements:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/teacher/lessons/complete", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const data = markLessonCompletedSchema.parse(req.body);
      
      const progression = await storage.markLessonCompleted({
        ...data,
        teacherId: userId
      });
      
      res.json(progression);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Inspector routes - Un inspecteur ne voit que les professeurs de sa matière
  app.get("/api/inspector/teachers", requireAuth, async (req: any, res) => {
    try {
      const inspectorId = req.userId;
      const academicYear = req.query.academicYear as string || '2024-2025';
      const teachers = await storage.getTeachersByInspectorSubject(inspectorId, academicYear);
      res.json(teachers);
    } catch (error: any) {
      console.error('Error fetching teachers for inspector:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/inspector/progressions", requireAuth, async (req: any, res) => {
    try {
      const progressions = await storage.getAllClassProgressions();
      res.json(progressions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/inspector/teacher/:teacherId/progressions", requireAuth, async (req: any, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const academicYear = req.query.academicYear as string || '2024-2025';
      
      // Get progressions for this teacher
      const progressions = await storage.getAllClassProgressions(academicYear);
      const teacherProgressions = progressions.filter(p => p.teacherId === teacherId);
      
      res.json(teacherProgressions);
    } catch (error: any) {
      console.error('Error fetching teacher progressions:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/inspector/teacher/:teacherId/class/:classId/progressions", requireAuth, async (req: any, res) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const classId = parseInt(req.params.classId);
      // Get progressions for this teacher and class
      const progressions = await storage.getAllClassProgressions();
      const filteredProgressions = progressions.filter(p => 
        p.teacherId === teacherId && p.classId === classId
      );
      res.json(filteredProgressions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/inspector/progressions/:progressionId/validate", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const progressionId = parseInt(req.params.progressionId);
      
      const progression = await storage.validateProgression(progressionId, userId);
      res.json(progression);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/inspector/stats", requireAuth, async (req: any, res) => {
    try {
      const stats = await storage.getProgressionStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Founder routes
  app.get("/api/founder/progressions", requireAuth, async (req: any, res) => {
    try {
      const progressions = await storage.getAllClassProgressions();
      res.json(progressions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/founder/stats", requireAuth, async (req: any, res) => {
    try {
      const stats = await storage.getProgressionStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const limit = parseInt(req.query.limit as string) || 20;
      const notifications = await storage.getUserNotifications(userId, limit);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notifications/count", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications/read-all", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.deleteNotification(notificationId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications/check-delays", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      await storage.checkDelayedLessons(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Anomaly reports routes
  app.get("/api/anomaly-reports", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (user?.role === 'teacher') {
        // Teachers can only see their own reports
        const reports = await storage.getAnomalyReportsByTeacher(userId);
        res.json(reports);
      } else if (['inspector', 'founder', 'sg'].includes(user?.role || '')) {
        // Inspectors, founders, and SG can see all reports
        const reports = await storage.getAllAnomalyReports();
        res.json(reports);
      } else {
        res.status(403).json({ message: "Accès refusé" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/anomaly-reports", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      console.log("User ID:", userId);
      console.log("Données reçues pour signalement:", req.body);
      
      // Créer un schéma qui exclu teacherId
      const frontendSchema = z.object({
        type: z.enum(['content', 'hours', 'schedule', 'incident']),
        title: z.string().min(5),
        description: z.string().min(10),
        recipients: z.array(z.enum(['fondateur', 'sg', 'inspecteur'])).min(1),
        lessonId: z.number().optional(),
        classId: z.number().optional(),
        subjectId: z.number().optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
        status: z.enum(['open', 'in_review', 'resolved', 'rejected']).default('open'),
        reviewedBy: z.number().optional(),
        reviewNotes: z.string().optional(),
      });
      
      const data = frontendSchema.parse(req.body);
      
      const report = await storage.createAnomalyReport({
        ...data,
        teacherId: userId,
      });
      
      res.json(report);
    } catch (error: any) {
      console.error("Erreur lors du signalement:", error);
      if (error.issues) {
        // Erreur de validation Zod
        res.status(400).json({ 
          message: "Erreur de validation", 
          details: error.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
        });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  });

  app.put("/api/anomaly-reports/:id", requireAuth, async (req: any, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!['inspector', 'founder', 'sg'].includes(user?.role || '')) {
        return res.status(403).json({ message: "Accès refusé - Rôle insuffisant" });
      }
      
      const updateData = {
        ...req.body,
        reviewedBy: userId,
        updatedAt: new Date(),
      };
      
      if (req.body.status === 'resolved') {
        updateData.resolvedAt = new Date();
      }
      
      const report = await storage.updateAnomalyReport(reportId, updateData);
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // SG specific endpoints
  app.get("/api/sg/teachers", requireAuth, async (req: any, res: Response) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "sg") {
        return res.status(403).json({ message: "Accès refusé - Seuls les SG peuvent accéder à cette ressource" });
      }
      
      // Récupérer les professeurs du même cycle que le SG
      const teachers = await storage.getTeachersBySgCycle(userId);
      res.json(teachers);
    } catch (error) {
      console.error("Erreur lors de la récupération des professeurs:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/sg/classes", requireAuth, async (req: any, res: Response) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "sg") {
        return res.status(403).json({ message: "Accès refusé - Seuls les SG peuvent accéder à cette ressource" });
      }
      
      // Récupérer les classes du même cycle que le SG
      const classes = await storage.getClassesBySgCycle(userId);
      res.json(classes);
    } catch (error) {
      console.error("Erreur lors de la récupération des classes:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // SG Reports routes
  app.get("/api/sg-reports", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (user?.role === 'sg') {
        // SG can see their own reports
        const reports = await storage.getSgReportsBySg(userId);
        res.json(reports);
      } else if (['inspector', 'founder'].includes(user?.role || '')) {
        // Inspectors and founders can see all SG reports
        const reports = await storage.getAllSgReports();
        res.json(reports);
      } else {
        res.status(403).json({ message: "Accès refusé" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sg-reports", requireAuth, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'sg') {
        return res.status(403).json({ message: "Accès refusé - Rôle SG requis" });
      }
      
      const data = insertSgReportSchema.parse(req.body);
      
      const report = await storage.createSgReport({
        ...data,
        sgId: userId,
      });

      // Créer une notification pour le fondateur
      const founders = await storage.getUsersByRole('founder');
      for (const founder of founders) {
        await storage.createNotification({
          userId: founder.id,
          type: 'sg_report_submitted',
          title: 'Nouveau rapport SG soumis',
          message: `${user.firstName} ${user.lastName} a soumis un rapport de surveillance pour validation.`,
          relatedEntityType: 'sg_report',
          relatedEntityId: report.id,
        });
      }
      
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/sg-reports/:id", requireAuth, async (req: any, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'sg') {
        return res.status(403).json({ message: "Accès refusé - Rôle SG requis" });
      }
      
      const updateData = {
        ...req.body,
        updatedAt: new Date(),
      };
      
      const report = await storage.updateSgReport(reportId, updateData);
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Endpoint pour valider un rapport SG (pour les fondateurs)
  app.put("/api/sg-reports/:id/validate", requireAuth, async (req: any, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'founder') {
        return res.status(403).json({ message: "Accès refusé - Rôle fondateur requis" });
      }
      
      const { sessionValidated, validationNotes } = req.body;
      
      const report = await storage.updateSgReport(reportId, {
        sessionValidated,
        validationNotes,
        updatedAt: new Date(),
      });

      // Créer une notification pour le SG
      const sgReport = await storage.getSgReportById(reportId);
      if (sgReport) {
        await storage.createNotification({
          userId: sgReport.sgId,
          type: 'sg_report_validated',
          title: sessionValidated ? 'Rapport validé' : 'Rapport rejeté',
          message: sessionValidated 
            ? `Votre rapport de surveillance a été validé par le fondateur.`
            : `Votre rapport de surveillance a été rejeté. Raison: ${validationNotes || 'Aucune raison spécifiée'}`,
          relatedEntityType: 'sg_report',
          relatedEntityId: reportId,
        });
      }
      
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin middleware - check admin role
  const requireAdmin = async (req: any, res: Response, next: NextFunction) => {
    try {
      console.log("requireAdmin - checking user:", req.userId, "authStore size:", authStore.size);
      const user = await storage.getUser(req.userId);
      console.log("requireAdmin - user found:", user?.username, user?.role);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Accès refusé - Rôle administrateur requis" });
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error("Admin check error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  };

  // Admin routes
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/users", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const userData = createUserSchema.parse(req.body);
      
      // Validation des champs d'assignation selon le rôle
      if ((userData.role === 'teacher' || userData.role === 'inspector') && !userData.subjectId) {
        return res.status(400).json({ message: "Une matière doit être assignée pour ce rôle" });
      }
      
      if (userData.role === 'sg' && !userData.cycle) {
        return res.status(400).json({ message: "Un cycle doit être assigné pour ce rôle" });
      }
      
      // Créer l'utilisateur avec mot de passe hashé
      const { subjectId, cycle, selectedClasses, ...userCreateData } = userData;
      const hashedPassword = await bcrypt.hash(userCreateData.password, 10);
      const user = await storage.createUser({ ...userCreateData, password: hashedPassword });
      
      // Créer les assignations selon le rôle
      const currentYear = "2024-2025";
      
      if (userData.role === 'teacher' && subjectId) {
        // Créer les assignations aux classes pour le professeur
        if (selectedClasses && selectedClasses.length > 0) {
          await storage.createTeacherAssignments(
            user.id,
            parseInt(subjectId),
            selectedClasses,
            currentYear
          );
        }
      }
      
      if (userData.role === 'inspector' && subjectId) {
        await storage.createInspectorAssignment({
          inspectorId: user.id,
          subjectId: parseInt(subjectId),
          academicYear: currentYear,
        });
      }
      
      if (userData.role === 'sg' && cycle) {
        await storage.createSgAssignment({
          sgId: user.id,
          cycle: cycle,
          academicYear: currentYear,
        });
      }
      
      // Log the action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'create_user',
        entityType: 'user',
        entityId: user.id,
        details: JSON.stringify({ 
          username: user.username, 
          role: user.role,
          assignment: userData.role === 'inspector' || userData.role === 'teacher' ? `matière ${subjectId}` : userData.role === 'sg' ? `cycle ${cycle}` : 'aucune'
        }),
      });
      
      res.status(201).json(user);
    } catch (error: any) {
      console.error("Error creating user:", error);
      
      // Better error handling for validation errors
      if (error.name === 'ZodError') {
        const issues = error.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        return res.status(400).json({ message: `Erreur de validation: ${issues}` });
      }
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return res.status(400).json({ message: "Ce nom d'utilisateur existe déjà" });
      }
      
      res.status(400).json({ message: "Erreur lors de la création de l'utilisateur" });
    }
  });

  // Update user
  app.put("/api/admin/users/:id", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (!userId) {
        return res.status(400).json({ message: "ID utilisateur invalide" });
      }

      const userData = updateUserSchema.parse(req.body);
      
      // Hash password if it's being updated
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      
      const updatedUser = await storage.updateUser(userId, userData);
      
      // Log the action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'update_user',
        entityType: 'user',
        entityId: updatedUser.id,
        details: JSON.stringify({ username: updatedUser.username, role: updatedUser.role }),
      });
      
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user:", error);
      
      if (error.name === 'ZodError') {
        const issues = error.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        return res.status(400).json({ message: `Erreur de validation: ${issues}` });
      }
      
      if (error.code === '23505') {
        return res.status(400).json({ message: "Ce nom d'utilisateur existe déjà" });
      }
      
      res.status(400).json({ message: "Erreur lors de la modification de l'utilisateur" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (!userId) {
        return res.status(400).json({ message: "ID utilisateur invalide" });
      }

      // Prevent self-deletion
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte" });
      }

      // Get user info before deletion for logging
      const userToDelete = await storage.getUser(userId);
      if (!userToDelete) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }

      await storage.deleteUser(userId);
      
      // Log the action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'delete_user',
        entityType: 'user',
        entityId: userId,
        details: JSON.stringify({ username: userToDelete.username, role: userToDelete.role }),
      });
      
      res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(400).json({ message: "Erreur lors de la suppression de l'utilisateur" });
    }
  });

  // Subjects management
  app.get("/api/admin/subjects", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      console.log("Fetching subjects for admin user:", req.user?.id, req.user?.role);
      const subjects = await storage.getAllSubjects();
      console.log("Subjects retrieved:", subjects);
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/subjects", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      console.log("Creating new subject:", req.body);
      const subjectData = req.body;
      
      if (!subjectData.name || !subjectData.code) {
        return res.status(400).json({ message: "Le nom et le code sont requis" });
      }

      const subject = await storage.createSubject({
        name: subjectData.name,
        code: subjectData.code,
        description: subjectData.description || ""
      });

      // Log the action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'create_subject',
        entityType: 'subject',
        entityId: subject.id,
        details: JSON.stringify({ name: subject.name, code: subject.code }),
      });

      res.status(201).json(subject);
    } catch (error: any) {
      console.error("Error creating subject:", error);
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return res.status(400).json({ message: "Ce code de matière existe déjà" });
      }
      
      res.status(400).json({ message: "Erreur lors de la création de la matière" });
    }
  });

  app.get("/api/admin/levels", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      console.log("Fetching levels for admin user:", req.user?.id, req.user?.role);
      const levels = await storage.getAllLevels();
      console.log("Levels retrieved:", levels);
      res.json(levels);
    } catch (error) {
      console.error("Error fetching levels:", error);
      res.status(500).json({ message: "Erreur lors de la récupération des niveaux" });
    }
  });

  app.post("/api/admin/levels", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      console.log("Creating new level:", req.body);
      const levelData = req.body;
      
      if (!levelData.name || !levelData.code || !levelData.category) {
        return res.status(400).json({ message: "Le nom, le code et la catégorie sont requis" });
      }

      const level = await storage.createLevel({
        name: levelData.name,
        code: levelData.code,
        category: levelData.category
      });

      // Log the action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'create_level',
        entityType: 'level',
        entityId: level.id,
        details: JSON.stringify({ name: level.name, code: level.code, category: level.category }),
      });

      res.status(201).json(level);
    } catch (error: any) {
      console.error("Error creating level:", error);
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return res.status(400).json({ message: "Ce code de niveau existe déjà" });
      }
      
      res.status(400).json({ message: "Erreur lors de la création du niveau" });
    }
  });

  app.put("/api/admin/levels/:id", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const levelId = parseInt(req.params.id);
      if (!levelId) {
        return res.status(400).json({ message: "ID niveau invalide" });
      }

      const levelData = req.body;
      if (!levelData.name || !levelData.code || !levelData.category) {
        return res.status(400).json({ message: "Le nom, le code et la catégorie sont requis" });
      }

      const updatedLevel = await storage.updateLevel(levelId, levelData);
      
      // Log the action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'update_level',
        entityType: 'level',
        entityId: updatedLevel.id,
        details: JSON.stringify({ name: updatedLevel.name, code: updatedLevel.code, category: updatedLevel.category }),
      });
      
      res.json(updatedLevel);
    } catch (error: any) {
      console.error("Error updating level:", error);
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return res.status(400).json({ message: "Ce code de niveau existe déjà" });
      }
      
      res.status(400).json({ message: "Erreur lors de la modification du niveau" });
    }
  });

  app.delete("/api/admin/levels/:id", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const levelId = parseInt(req.params.id);
      console.log("DELETE /api/admin/levels/:id - Received levelId:", levelId);
      
      if (!levelId) {
        console.log("Invalid levelId provided");
        return res.status(400).json({ message: "ID niveau invalide" });
      }

      // Get level info before deletion for logging
      const levelToDelete = await storage.getLevel(levelId);
      console.log("Level to delete:", levelToDelete);
      
      if (!levelToDelete) {
        console.log("Level not found with ID:", levelId);
        return res.status(404).json({ message: "Niveau non trouvé" });
      }

      console.log("Attempting to delete level:", levelToDelete.name);
      await storage.deleteLevel(levelId);
      console.log("Level deleted successfully");
      
      // Log the action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'delete_level',
        entityType: 'level',
        entityId: levelId,
        details: JSON.stringify({ name: levelToDelete.name, code: levelToDelete.code, category: levelToDelete.category }),
      });
      
      console.log("Audit log created, sending success response");
      res.json({ message: "Niveau supprimé avec succès", deletedLevel: levelToDelete });
    } catch (error: any) {
      console.error("Error deleting level:", error);
      
      // Handle foreign key constraint violations with specific message
      if (error.code === '23503') {
        return res.status(400).json({ message: "Ce niveau ne peut pas être supprimé car il est utilisé par d'autres éléments (chapitres, classes, etc.). Supprimez d'abord les éléments associés." });
      }
      
      // Handle custom error messages from storage
      if (error.message.includes('chapitre(s)') || error.message.includes('classe(s)')) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(400).json({ message: "Erreur lors de la suppression du niveau" });
    }
  });

  // Classes management
  app.get("/api/admin/classes", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/classes", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      console.log("Creating new class:", req.body);
      const classData = insertClassSchema.parse(req.body);
      
      const newClass = await storage.createClass(classData);
      
      // Log the action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'create_class',
        entityType: 'class',
        entityId: newClass.id,
        details: JSON.stringify({ name: newClass.name, levelId: newClass.levelId }),
      });
      
      res.status(201).json(newClass);
    } catch (error: any) {
      console.error("Error creating class:", error);
      
      if (error.name === 'ZodError') {
        const issues = error.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        return res.status(400).json({ message: `Erreur de validation: ${issues}` });
      }
      
      res.status(400).json({ message: "Erreur lors de la création de la classe" });
    }
  });

  app.put("/api/admin/classes/:id", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const classId = parseInt(req.params.id);
      if (!classId) {
        return res.status(400).json({ message: "ID classe invalide" });
      }

      const classData = updateClassSchema.parse(req.body);
      const updatedClass = await storage.updateClass(classId, classData);
      
      // Log the action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'update_class',
        entityType: 'class',
        entityId: updatedClass.id,
        details: JSON.stringify({ name: updatedClass.name, levelId: updatedClass.levelId }),
      });
      
      res.json(updatedClass);
    } catch (error: any) {
      console.error("Error updating class:", error);
      
      if (error.name === 'ZodError') {
        const issues = error.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        return res.status(400).json({ message: `Erreur de validation: ${issues}` });
      }
      
      res.status(400).json({ message: "Erreur lors de la modification de la classe" });
    }
  });

  app.delete("/api/admin/classes/:id", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const classId = parseInt(req.params.id);
      if (!classId) {
        return res.status(400).json({ message: "ID classe invalide" });
      }

      // Get class info before deletion for logging
      const classToDelete = await storage.getClass(classId);
      if (!classToDelete) {
        return res.status(404).json({ message: "Classe non trouvée" });
      }

      await storage.deleteClass(classId);
      
      // Log the action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'delete_class',
        entityType: 'class',
        entityId: classId,
        details: JSON.stringify({ name: classToDelete.name, levelId: classToDelete.levelId }),
      });
      
      res.json({ message: "Classe supprimée avec succès" });
    } catch (error: any) {
      console.error("Error deleting class:", error);
      res.status(400).json({ message: "Erreur lors de la suppression de la classe" });
    }
  });

  // Lessons management
  app.get("/api/admin/lessons", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const lessons = await storage.getAllLessons();
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.post("/api/admin/lessons", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      console.log("Received lesson creation request:", req.body);
      
      // Handle both old format (with chapterId) and new format (with subjectId, levelId, chapterName)
      if (req.body.chapterName && req.body.subjectId && req.body.levelId) {
        // New format: Create chapter if it doesn't exist, then create lesson
        const { chapterName, subjectId, levelId, ...lessonData } = req.body;
        
        // Check if chapter already exists
        let chapter = await storage.getChapterByNameSubjectLevel(chapterName, parseInt(subjectId), parseInt(levelId));
        
        if (!chapter) {
          // Create new chapter
          const newChapter = await storage.createChapter({
            name: chapterName,
            subjectId: parseInt(subjectId),
            levelId: parseInt(levelId),
            orderIndex: 1, // Default order index
            trimester: 1 // Default trimester
          });
          chapter = newChapter;
          console.log("Created new chapter:", chapter);
        }
        
        // Create lesson with the chapter ID
        const fullLessonData = {
          ...lessonData,
          chapterId: chapter.id
        };
        console.log("Creating lesson with data:", fullLessonData);
        
        const lesson = await storage.createLesson(fullLessonData);
        
        // Log the action
        await storage.createAuditLog({
          userId: req.user.id,
          action: 'create_lesson',
          entityType: 'lesson',
          entityId: lesson.id,
          details: JSON.stringify({ title: lesson.title, chapterId: lesson.chapterId, chapterName }),
        });
        
        res.status(201).json(lesson);
      } else {
        // Old format: Direct lesson creation with existing chapterId
        const lessonData = insertLessonSchema.parse(req.body);
        const lesson = await storage.createLesson(lessonData);
        
        // Log the action
        await storage.createAuditLog({
          userId: req.user.id,
          action: 'create_lesson',
          entityType: 'lesson',
          entityId: lesson.id,
          details: JSON.stringify({ title: lesson.title, chapterId: lesson.chapterId }),
        });
        
        res.status(201).json(lesson);
      }
    } catch (error: any) {
      console.error("Error creating lesson:", error);
      
      if (error.name === 'ZodError') {
        const issues = error.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        return res.status(400).json({ message: `Erreur de validation: ${issues}` });
      }
      
      res.status(400).json({ message: "Erreur lors de la création de la leçon" });
    }
  });

  app.put("/api/admin/lessons/:id", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const lessonId = parseInt(req.params.id);
      if (!lessonId) {
        return res.status(400).json({ message: "ID leçon invalide" });
      }

      const lessonData = insertLessonSchema.partial().parse(req.body);
      const updatedLesson = await storage.updateLesson(lessonId, lessonData);
      
      // Log the action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'update_lesson',
        entityType: 'lesson',
        entityId: updatedLesson.id,
        details: JSON.stringify({ title: updatedLesson.title, chapterId: updatedLesson.chapterId }),
      });
      
      res.json(updatedLesson);
    } catch (error: any) {
      console.error("Error updating lesson:", error);
      
      if (error.name === 'ZodError') {
        const issues = error.issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        return res.status(400).json({ message: `Erreur de validation: ${issues}` });
      }
      
      res.status(400).json({ message: "Erreur lors de la modification de la leçon" });
    }
  });

  app.delete("/api/admin/lessons/:id", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const lessonId = parseInt(req.params.id);
      if (!lessonId) {
        return res.status(400).json({ message: "ID leçon invalide" });
      }

      // Get lesson info before deletion for logging
      const lessonToDelete = await storage.getLesson(lessonId);
      if (!lessonToDelete) {
        return res.status(404).json({ message: "Leçon non trouvée" });
      }

      await storage.deleteLesson(lessonId);
      
      // Log the action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'delete_lesson',
        entityType: 'lesson',
        entityId: lessonId,
        details: JSON.stringify({ title: lessonToDelete.title, chapterId: lessonToDelete.chapterId }),
      });
      
      res.json({ message: "Leçon supprimée avec succès" });
    } catch (error: any) {
      console.error("Error deleting lesson:", error);
      res.status(400).json({ message: "Erreur lors de la suppression de la leçon" });
    }
  });

  // Get chapters for lesson forms
  app.get("/api/admin/chapters", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const chapters = await storage.getAllChapters();
      res.json(chapters);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Audit logs
  app.get("/api/admin/logs", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const logs = await storage.getAuditLogs(limit, offset);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Route pour récupérer les années académiques disponibles avec détection automatique
  app.get("/api/academic-years", requireAuth, async (req: any, res: Response) => {
    try {
      const years = await db.select({
        name: schema.academicYears.name,
        status: schema.academicYears.status
      })
      .from(schema.academicYears)
      .orderBy(desc(schema.academicYears.name));
      
      const yearsList = years.map(year => year.name);
      
      // Générer automatiquement la nouvelle année académique si nécessaire
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth(); // 0-11
      
      // Année scolaire commence en septembre (mois 8) et se termine en juin (mois 5)
      let newAcademicYear: string;
      if (currentMonth >= 8) { // Septembre à décembre
        newAcademicYear = `${currentYear}-${currentYear + 1}`;
      } else { // Janvier à août
        newAcademicYear = `${currentYear - 1}-${currentYear}`;
      }
      
      // Ajouter la nouvelle année si elle n'existe pas
      if (!yearsList.includes(newAcademicYear)) {
        yearsList.unshift(newAcademicYear);
      }
      
      // Ajouter l'option "Nouvelle année académique" pour l'admin
      const user = await storage.getUser(req.userId);
      if (user && user.role === 'admin') {
        // Calculer l'année académique suivante
        const latestYear = yearsList[0] || '2024-2025';
        const [startYear] = latestYear.split('-').map(Number);
        const nextAcademicYear = `${startYear + 1}-${startYear + 2}`;
        
        if (!yearsList.includes(nextAcademicYear)) {
          yearsList.unshift(`+ ${nextAcademicYear} (Nouvelle année)`);
        }
      }
      
      res.json(yearsList);
    } catch (error) {
      console.error("Erreur lors de la récupération des années académiques:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // API pour définir l'année académique active (admin seulement)
  app.post("/api/admin/set-academic-year", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const { academicYear } = req.body;
      
      if (!academicYear) {
        return res.status(400).json({ message: "Année académique requise" });
      }
      
      // Si c'est une nouvelle année (contient "+"), on crée la structure
      if (academicYear.startsWith('+')) {
        const cleanYear = academicYear.replace('+ ', '').replace(' (Nouvelle année)', '');
        await storage.createNewAcademicYear(cleanYear);
        
        res.json({ 
          message: "Nouvelle année académique créée avec succès",
          academicYear: cleanYear,
          isNewYear: true
        });
      } else {
        // Pour l'instant, on peut simplement retourner un succès
        // En production, on pourrait stocker ceci en base de données
        res.json({ 
          message: "Année académique définie avec succès",
          academicYear 
        });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // API avancée pour créer une nouvelle année scolaire avec options de copie
  app.post("/api/admin/create-academic-year", requireAuth, requireAdmin, async (req: any, res: Response) => {
    try {
      const { yearName, copyOptions } = req.body;
      
      if (!yearName) {
        return res.status(400).json({ message: "Nom d'année scolaire requis" });
      }
      
      // Vérifier si l'année existe déjà
      const existingClasses = await db.select()
        .from(classes)
        .where(eq(classes.academicYear, yearName))
        .limit(1);
      
      if (existingClasses.length > 0) {
        return res.status(400).json({ message: "Cette année scolaire existe déjà" });
      }
      
      await storage.createAdvancedAcademicYear(yearName, copyOptions);
      
      res.json({ 
        message: "Année scolaire créée avec succès",
        academicYear: yearName,
        copyOptions
      });
    } catch (error: any) {
      console.error("Erreur lors de la création de l'année scolaire:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Founder routes - for volume horaire and tarif management
  const requireFounder = async (req: any, res: Response, next: NextFunction) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user || user.role !== 'founder') {
        return res.status(403).json({ message: "Accès refusé - Rôle fondateur requis" });
      }
      req.user = user;
      next();
    } catch (error) {
      console.error("Founder check error:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  };

  // Get teachers with work hours calculation
  app.get("/api/founder/teachers", requireAuth, requireFounder, async (req: any, res: Response) => {
    try {
      // For now return basic teacher list - will enhance with volume horaire calculation
      const teachers = await storage.getAllUsers();
      const teachersOnly = teachers.filter(user => user.role === 'teacher');
      res.json(teachersOnly);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Get subjects for filtering
  app.get("/api/founder/subjects", requireAuth, requireFounder, async (req: any, res: Response) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Get levels for filtering
  app.get("/api/founder/levels", requireAuth, requireFounder, async (req: any, res: Response) => {
    try {
      const levels = await storage.getAllLevels();
      res.json(levels);
    } catch (error) {
      console.error("Error fetching levels:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Get teacher hours by period (week, month, semester, year)
  app.get("/api/founder/teacher-hours", requireAuth, requireFounder, async (req: any, res: Response) => {
    try {
      const period = req.query.period || 'month';
      
      // Get all teacher assignments with their subjects and classes
      const assignments = await storage.getAllTeacherAssignments();
      
      // Group assignments by teacher
      const teacherGroups = assignments.reduce((acc: any, assignment: any) => {
        const teacherId = assignment.teacher.id;
        
        if (!acc[teacherId]) {
          acc[teacherId] = {
            id: assignment.teacher.id,
            username: assignment.teacher.username,
            firstName: assignment.teacher.firstName,
            lastName: assignment.teacher.lastName,
            email: assignment.teacher.email,
            role: assignment.teacher.role,
            hourlyRate: parseFloat(assignment.teacher.hourlyRate || '0'),
            subject: assignment.subject, // Real subject data
            assignments: [],
            classes: []
          };
        }
        
        // Add this assignment to the teacher's assignments
        acc[teacherId].assignments.push(assignment);
        acc[teacherId].classes.push(`${assignment.class.name} (${assignment.class.level.name})`);
        
        return acc;
      }, {});
      
      // Calculate hours for each teacher based on real progressions
      const teachersWithHours = await Promise.all(
        Object.values(teacherGroups).map(async (teacherGroup: any) => {
          // Get actual progressions for this teacher
          const progressions = await storage.getProgressionsByTeacher(teacherGroup.id);
          
          // Calculate actual hours from progressions
          const actualHours = progressions.reduce((total: number, progression: any) => {
            return total + (progression.actualDuration || 0);
          }, 0);
          
          // Calculate different period hours (simple calculation for now)
          const monthlyHours = actualHours / 12; // Assuming annual hours divided by 12
          const weeklyHours = monthlyHours / 4;
          const semesterHours = monthlyHours * 6;
          const yearlyHours = actualHours;
          
          return {
            ...teacherGroup,
            weeklyHours: Math.round(weeklyHours * 100) / 100,
            monthlyHours: Math.round(monthlyHours * 100) / 100,
            semesterHours: Math.round(semesterHours * 100) / 100,
            yearlyHours: Math.round(yearlyHours * 100) / 100,
            classes: [...new Set(teacherGroup.classes)] // Remove duplicates
          };
        })
      );
      
      res.json(teachersWithHours);
    } catch (error) {
      console.error("Error fetching teacher hours:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Update teacher hourly rate
  app.put("/api/founder/teacher-hourly-rate/:teacherId", requireAuth, requireFounder, async (req: any, res: Response) => {
    try {
      const teacherId = parseInt(req.params.teacherId);
      const { hourlyRate } = req.body;
      
      if (!teacherId || typeof hourlyRate !== 'number' || hourlyRate < 0) {
        return res.status(400).json({ message: "Données invalides" });
      }
      
      const updatedUser = await storage.updateUserHourlyRate(teacherId, hourlyRate);
      res.json({ message: "Tarif horaire mis à jour", user: updatedUser });
    } catch (error) {
      console.error("Error updating hourly rate:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Get teacher statistics with control data
  app.get("/api/founder/teacher-statistics", requireAuth, requireFounder, async (req: any, res: Response) => {
    try {
      // Get all teachers with their assignments
      const teachers = await storage.getAllUsers();
      const teacherUsers = teachers.filter(user => user.role === 'teacher');
      
      // Get all progressions to calculate statistics
      const allProgressions = await storage.getAllClassProgressions();
      
      const teacherStats = teacherUsers.map(teacher => {
        // Get progressions for this teacher
        const teacherProgressions = allProgressions.filter(p => p.teacherId === teacher.id);
        
        // Calculate lesson statistics
        const totalLessons = teacherProgressions.length;
        const completedLessons = teacherProgressions.filter(p => p.completedAt).length;
        const validatedLessons = teacherProgressions.filter(p => p.validatedAt).length;
        const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        // Calculate control statistics (simulate for now - can be replaced with real data)
        const plannedControls = Math.ceil(totalLessons * 0.3); // 30% of lessons should have controls
        const completedControls = Math.floor(completedLessons * 0.25); // 25% of completed lessons have controls
        
        return {
          ...teacher,
          totalLessons,
          completedLessons,
          validatedLessons,
          progressPercentage,
          plannedControls,
          completedControls
        };
      });
      
      res.json(teacherStats);
    } catch (error) {
      console.error("Error fetching teacher statistics:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });





  // Inspector routes - validate a progression
  app.post("/api/inspector/progressions/:progressionId/validate", requireAuth, async (req: any, res: Response) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'inspector') {
        return res.status(403).json({ message: "Accès refusé - Rôle inspecteur requis" });
      }
      
      const progressionId = parseInt(req.params.progressionId);
      if (!progressionId) {
        return res.status(400).json({ message: "ID progression invalide" });
      }
      
      // Validate the progression
      const validatedProgression = await storage.validateProgression(progressionId, userId);
      res.json(validatedProgression);
    } catch (error) {
      console.error("Error validating progression:", error);
      res.status(500).json({ message: "Erreur lors de la validation" });
    }
  });

  // SG Reports route for monthly teacher hours
  app.get("/api/sg-reports/teacher-hours", requireAuth, async (req: any, res: Response) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'sg') {
        return res.status(403).json({ message: "Accès refusé - Rôle SG requis" });
      }
      
      const month = req.query.month as string;
      const year = req.query.year as string;
      
      // Get detailed teacher hours report for SG's cycle
      const teacherHours = await storage.getTeacherHoursByMonth(userId, month, year);
      
      res.json(teacherHours);
    } catch (error) {
      console.error("Error fetching SG teacher hours:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // SG teacher statistics for progression tracking
  app.get("/api/sg/teacher-statistics", requireAuth, async (req: any, res: Response) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'sg') {
        return res.status(403).json({ message: "Accès refusé - Rôle SG requis" });
      }
      
      // Get teachers from SG's cycle
      const teachers = await storage.getTeachersBySgCycle(userId);
      
      // Get all progressions to calculate statistics
      const allProgressions = await storage.getAllClassProgressions();
      
      const teacherStats = teachers.map(teacher => {
        // Get progressions for this teacher
        const teacherProgressions = allProgressions.filter(p => p.teacherId === teacher.id);
        
        // Calculate lesson statistics
        const totalLessons = teacherProgressions.length;
        const completedLessons = teacherProgressions.filter(p => p.completedAt).length;
        const validatedLessons = teacherProgressions.filter(p => p.validatedAt).length;
        const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        // Calculate control statistics (simulate for now - can be replaced with real data)
        const plannedControls = Math.ceil(totalLessons * 0.3); // 30% of lessons should have controls
        const completedControls = Math.floor(completedLessons * 0.25); // 25% of completed lessons have controls
        
        return {
          ...teacher,
          totalLessons,
          completedLessons,
          validatedLessons,
          progressPercentage,
          plannedControls,
          completedControls
        };
      });
      
      res.json(teacherStats);
    } catch (error) {
      console.error("Error fetching SG teacher statistics:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Route pour envoyer une notification au SG
  app.post("/api/notify-sg", requireAuth, async (req: any, res: Response) => {
    try {
      const { title, message, type = 'info', priority = 'normal' } = req.body;
      const senderId = req.userId;
      
      // Vérifier les données
      if (!title || !message) {
        return res.status(400).json({ message: "Titre et message requis" });
      }

      // Vérifier que l'utilisateur a le droit d'envoyer des notifications
      const sender = await storage.getUser(senderId);
      if (!sender || !['teacher', 'inspector', 'founder'].includes(sender.role)) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      // Obtenir tous les SG
      const allUsers = await storage.getAllUsers();
      const sgUsers = allUsers.filter(user => user.role === 'sg');
      
      // Créer des notifications pour tous les SG
      const notifications = await Promise.all(
        sgUsers.map(sg => 
          storage.createNotification({
            userId: sg.id,
            type: `${sender.role}_notification`,
            title: `${sender.firstName} ${sender.lastName} - ${title}`,
            message: `[${sender.role.toUpperCase()}] ${message}`,
            relatedEntityType: 'user',
            relatedEntityId: senderId,
            priority: priority
          })
        )
      );

      res.json({ 
        success: true, 
        message: `Notification envoyée à ${sgUsers.length} surveillant(s) général/généraux`,
        notifications: notifications.length
      });
    } catch (error) {
      console.error("Error sending notification to SG:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  // Route pour obtenir les SG disponibles (pour les professeurs/inspecteurs/fondateurs)
  app.get("/api/sg-users", requireAuth, async (req: any, res: Response) => {
    try {
      const userId = req.userId;
      const user = await storage.getUser(userId);
      
      // Vérifier les permissions
      if (!user || !['teacher', 'inspector', 'founder', 'admin'].includes(user.role)) {
        return res.status(403).json({ message: "Accès refusé" });
      }

      // Obtenir tous les SG
      const allUsers = await storage.getAllUsers();
      const sgUsers = allUsers
        .filter(user => user.role === 'sg')
        .map(sg => ({
          id: sg.id,
          username: sg.username,
          firstName: sg.firstName,
          lastName: sg.lastName,
          email: sg.email
        }));

      res.json(sgUsers);
    } catch (error) {
      console.error("Error fetching SG users:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}