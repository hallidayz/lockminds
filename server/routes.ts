import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, AuthenticatedRequest, requireLowRisk, requireStrongAuth } from "./middleware/auth";
import authRoutes from './routes/auth';
import { insertVaultEntrySchema, insertSecurityLogSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.use('/api/auth', authRoutes);

  // Vault entries (requires authentication and low risk)
  app.get('/api/vault', authenticateToken, requireLowRisk(30), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const entries = await storage.getVaultEntries(userId);
      res.json({ success: true, entries });
    } catch (error) {
      console.error('Get vault entries error:', error);
      res.status(500).json({ error: 'Failed to retrieve vault entries' });
    }
  });

  app.post('/api/vault', authenticateToken, requireLowRisk(20), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const entryData = insertVaultEntrySchema.parse(req.body);
      const entry = await storage.createVaultEntry({ ...entryData, userId });
      
      await storage.createSecurityLog({
        userId,
        message: `Vault entry created: ${entry.name}`
      });
      
      res.json({ success: true, entry });
    } catch (error) {
      console.error('Create vault entry error:', error);
      res.status(400).json({ error: 'Failed to create vault entry' });
    }
  });

  app.put('/api/vault/:id', authenticateToken, requireLowRisk(25), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const entryData = insertVaultEntrySchema.partial().parse(req.body);
      const entry = await storage.updateVaultEntry(id, entryData);
      
      if (!entry) {
        return res.status(404).json({ error: 'Vault entry not found' });
      }
      
      await storage.createSecurityLog({
        userId: req.user!.userId,
        message: `Vault entry updated: ${entry.name}`
      });
      
      res.json({ success: true, entry });
    } catch (error) {
      console.error('Update vault entry error:', error);
      res.status(400).json({ error: 'Failed to update vault entry' });
    }
  });

  app.delete('/api/vault/:id', authenticateToken, requireStrongAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteVaultEntry(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Vault entry not found' });
      }
      
      await storage.createSecurityLog({
        userId: req.user!.userId,
        message: `Vault entry deleted: ${id}`
      });
      
      res.json({ success: true, message: 'Vault entry deleted' });
    } catch (error) {
      console.error('Delete vault entry error:', error);
      res.status(500).json({ error: 'Failed to delete vault entry' });
    }
  });

  // Security logs (requires authentication)
  app.get('/api/security-logs', authenticateToken, requireLowRisk(40), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.userId;
      const logs = await storage.getSecurityLogs(userId);
      res.json({ success: true, logs });
    } catch (error) {
      console.error('Get security logs error:', error);
      res.status(500).json({ error: 'Failed to retrieve security logs' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        authentication: 'ready',
        webauthn: 'ready'
      }
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
