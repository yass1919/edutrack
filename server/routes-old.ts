import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, markLessonCompletedSchema } from "@shared/schema";
import { z } from "zod";
import { authStore, requireAuth } from "./index";

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect" });
      }

      // Store user in session
      req.session.userId = user.id;
      console.log("Session saved with userId:", req.session.userId);
      
      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erreur lors de la déconnexion" });
      }
      res.json({ message: "Déconnecté avec succès" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = req.session.userId;
    console.log("Auth check - userId:", userId, "sessionID:", req.sessionID);
    if (!userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }

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
  app.get("/api/teacher/assignments", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const assignments = await storage.getTeacherAssignments(userId);
      res.json(assignments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/teacher/classes", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const classes = await storage.getClassesByTeacher(userId);
      res.json(classes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/teacher/subjects", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const subjects = await storage.getSubjectsByTeacher(userId);
      res.json(subjects);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lessons", async (req, res) => {
    try {
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

  app.post("/api/lessons/complete", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const data = markLessonCompletedSchema.parse(req.body);
      const progression = await storage.markLessonCompleted({ ...data, teacherId: userId });
      res.json(progression);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/teacher/stats", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const stats = await storage.getProgressionStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Inspector routes
  app.get("/api/inspector/progressions", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const user = await storage.getUser(userId);
      if (user?.role !== 'inspector') {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const progressions = await storage.getAllClassProgressions();
      res.json(progressions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/inspector/validate/:progressionId", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const user = await storage.getUser(userId);
      if (user?.role !== 'inspector') {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const progressionId = parseInt(req.params.progressionId);
      const progression = await storage.validateProgression(progressionId, userId);
      res.json(progression);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Founder routes
  app.get("/api/founder/stats", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const user = await storage.getUser(userId);
      if (user?.role !== 'founder') {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const stats = await storage.getProgressionStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/founder/progressions", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Non authentifié" });
      }

      const user = await storage.getUser(userId);
      if (user?.role !== 'founder') {
        return res.status(403).json({ message: "Accès refusé" });
      }

      const progressions = await storage.getAllClassProgressions();
      res.json(progressions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
