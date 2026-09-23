import bcrypt from 'bcryptjs';
import type { Application, RequestHandler } from 'express';
import fs from 'fs';
import path from 'path';
import type { DeliveryInfo, StoredChatAttachment, StoredProject, StoredUser } from '../../types/domain';
import {
  imageExtensionFromMime,
  publicProjectFileUrl,
  safeProjectFilePath
} from '../../utils/projectFiles';
import { workspaceUserId } from '../../utils/names';
import { readDeliveryInfo, requireDeliveryInfo } from '../../services/deliveryService';
import { buildChatHistoryPdf } from '../../services/chatHistoryPdfService';
import { rateLimiter } from '../../middleware/rateLimiter';

type HostTurnEvent = {
  projectId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  eventType: string;
  payload?: any;
};

type RegisterWebHttpRoutesDeps = {
  appendChatHistoryMessage: (historyId: string | null, userId: string | null | undefined, sender: 'user' | 'agent' | 'system', text: string, options?: any) => any;
  authMiddleware: RequestHandler;
  chatMessages: Record<string, any[]>;
  closeInterviewFromFilesystem: (project: StoredProject, userId: string) => StoredProject;
  createProjectRecord: (userId: string, projectName: string, extra?: Partial<StoredProject>) => StoredProject;
  deleteProjectRecord: (projectId: string, userId: string) => StoredProject | null;
  fileAuthMiddleware: RequestHandler;
  finalizeProjectDelivery: (args: { project: StoredProject; userId: string; sessionId?: string | null; source: string }) => Promise<StoredProject | null>;
  findChatHistoryForProject: (projectId: string) => any;
  findUnfinishedProjectForUser: (userId: string, exceptProjectId?: string | null) => StoredProject | null;
  findUser: (email: string) => StoredUser | undefined;
  findUserById: (id: string | null | undefined) => StoredUser | null;
  getConfirmedChatMessagesForProject: (projectId: string) => any[];
  getExecutionRecord: (projectId: string | null | undefined) => { sessionId: string } | null;
  getExecutionState: (projectId: string) => string;
  getProjectStateView: (project: StoredProject) => any;
  insertEditAttachment: (args: { projectId: string; userId: string; originalFilename: string; mime: string; ext: string }) => Promise<{ id: number; storedFilename: string }>;
  hasActiveHostSessionForProject: (project: StoredProject, history?: any) => boolean;
  publicProject: (project: StoredProject) => any;
  publicUser: (user: StoredUser) => any;
  readDb: () => any;
  reconcileProjectStatus: (project: StoredProject) => StoredProject;
  recordHostTurnEvent: (event: HostTurnEvent) => void;
  sendMotorDeleteCommand: (project: StoredProject) => Promise<string>;
  signToken: (user: StoredUser) => string;
  updateProject: (projectId: string, userId: string, patch: Partial<StoredProject>) => StoredProject | null;
  writeDb: (db: any) => void;
};

const registerRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Demasiados intentos. Espera un rato y volve a intentar.'
});

const loginRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demasiados intentos. Espera un rato y volve a intentar.'
});

export function registerWebHttpRoutes(app: Application, deps: RegisterWebHttpRoutesDeps) {
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/hello', (_req, res) => res.json({ message: 'Hola desde BaweStudio backend' }));

  app.post('/api/auth/register', registerRateLimiter, async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email y password son requeridos' });
    if (password.length < 8) return res.status(400).json({ error: 'password debe tener al menos 8 caracteres' });
    if (deps.findUser(email)) return res.status(400).json({ error: 'No se pudo completar el registro con esos datos.' });
    const hash = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();
    const user = {
      id: userId,
      email: email.toLowerCase(),
      name: name || '',
      hash,
      workspace_user_id: workspaceUserId(userId)
    };
    const db = deps.readDb();
    db.users.push(user);
    deps.writeDb(db);
    const token = deps.signToken(user);
    res.status(201).json({ token, user: deps.publicUser(user) });
  });

  app.post('/api/auth/login', loginRateLimiter, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email y password son requeridos' });
    const user = deps.findUser(email);
    if (!user) return res.status(401).json({ error: 'Credenciales invalidas' });
    const ok = await bcrypt.compare(password, user.hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales invalidas' });
    const token = deps.signToken(user);
    res.json({ token, user: deps.publicUser(user) });
  });

  app.get('/api/auth/me', deps.authMiddleware, (req, res) => {
    const user = deps.findUserById((req as any).user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(deps.publicUser(user));
  });

  app.get('/api/projects', deps.authMiddleware, (req, res) => {
    const db = deps.readDb();
    res.json(db.projects.filter((p: StoredProject) => p.userId === (req as any).user.id).map(deps.reconcileProjectStatus).map(deps.publicProject));
  });

  app.post('/api/projects', deps.authMiddleware, (req, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name es requerido' });
    const unfinished = deps.findUnfinishedProjectForUser((req as any).user.id);
    if (unfinished) {
      return res.status(409).json({
        error: 'Tenes un proyecto sin terminar.',
        code: 'UNFINISHED_PROJECT_EXISTS',
        project: deps.publicProject(deps.reconcileProjectStatus(unfinished))
      });
    }
    const project = deps.createProjectRecord((req as any).user.id, name, { description: description || '', status: 'pending' });
    res.status(201).json(deps.publicProject(project));
  });

  app.get('/api/projects/:id', deps.authMiddleware, (req, res) => {
    const found = deps.readDb().projects.find((p: StoredProject) => p.id === req.params.id && p.userId === (req as any).user.id);
    const project = found ? deps.reconcileProjectStatus(found) : null;
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(deps.publicProject(project));
  });

  app.get('/api/projects/:id/state', deps.authMiddleware, (req, res) => {
    const found = deps.readDb().projects.find((p: StoredProject) => p.id === req.params.id && p.userId === (req as any).user.id);
    const project = found ? deps.reconcileProjectStatus(found) : null;
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json({
      project_id: project.project_id,
      project_name: project.project_name,
      project_path: project.project_path,
      execution_session_id: deps.getExecutionRecord(project.id)?.sessionId || null,
      ...deps.getProjectStateView(project)
    });
  });

  app.post('/api/projects/:id/logo', deps.authMiddleware, async (req, res) => {
    const project = deps.readDb().projects.find((p: StoredProject) => p.id === req.params.id && p.userId === (req as any).user.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    const mime = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (!mime.startsWith('image/')) return res.status(415).json({ error: 'El archivo debe ser una imagen' });

    const originalName = String(req.headers['x-file-name'] || 'logo');
    const ext = imageExtensionFromMime(mime, originalName);
    const filename = `logo.${ext}`;
    const targetPath = safeProjectFilePath(project, filename);
    try {
      fs.mkdirSync(project.project_path, { recursive: true });
      const chunks: Buffer[] = [];
      let total = 0;
      req.on('data', chunk => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += buffer.length;
        chunks.push(buffer);
      });
      req.on('end', () => {
        try {
          if (!total) return res.status(400).json({ error: 'Imagen vacia' });
          const fileBuffer = Buffer.concat(chunks);
          fs.writeFileSync(targetPath, fileBuffer);
          const attachment: StoredChatAttachment = {
            type: 'image',
            filename,
            mime,
            projectPath: targetPath,
            url: publicProjectFileUrl(project.id, filename)
          };
          res.status(201).json({ attachment });
        } catch (err) {
          console.error(`[HTTP] Error guardando logo: ${err}`);
          res.status(500).json({ error: 'No se pudo guardar el logo' });
        }
      });
      req.on('error', err => {
        console.error(`[HTTP] Error recibiendo logo: ${err}`);
        res.status(500).json({ error: 'No se pudo guardar el logo' });
      });
    } catch (err) {
      console.error(`[HTTP] Error guardando logo: ${err}`);
      res.status(500).json({ error: 'No se pudo guardar el logo' });
    }
  });

  // Adjunto de una imagen durante el loop de "cambios" (edit-intake): a
  // diferencia del logo (un slot fijo por proyecto), cada turno del loop
  // puede traer una imagen distinta, y el nombre original del cliente no es
  // confiable (puede repetirse entre turnos o entre clientes) — el nombre
  // real en disco sale siempre de insertEditAttachment (id autoincremental
  // de la DB), nunca de un patron fijo.
  app.post('/api/projects/:id/edit-attachment', deps.authMiddleware, async (req, res) => {
    const project = deps.readDb().projects.find((p: StoredProject) => p.id === req.params.id && p.userId === (req as any).user.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    const mime = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (!mime.startsWith('image/')) return res.status(415).json({ error: 'El archivo debe ser una imagen' });

    const originalName = String(req.headers['x-file-name'] || 'imagen');
    const ext = imageExtensionFromMime(mime, originalName);
    try {
      fs.mkdirSync(project.project_path, { recursive: true });
      const chunks: Buffer[] = [];
      let total = 0;
      req.on('data', chunk => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += buffer.length;
        chunks.push(buffer);
      });
      req.on('end', async () => {
        try {
          if (!total) return res.status(400).json({ error: 'Imagen vacia' });
          const { storedFilename } = await deps.insertEditAttachment({
            projectId: project.id,
            userId: (req as any).user.id,
            originalFilename: originalName,
            mime,
            ext
          });
          const targetPath = safeProjectFilePath(project, storedFilename);
          const fileBuffer = Buffer.concat(chunks);
          fs.writeFileSync(targetPath, fileBuffer);
          const attachment: StoredChatAttachment = {
            type: 'image',
            filename: storedFilename,
            mime,
            projectPath: targetPath,
            url: publicProjectFileUrl(project.id, storedFilename)
          };
          res.status(201).json({ attachment });
        } catch (err) {
          console.error(`[HTTP] Error guardando adjunto de cambios: ${err}`);
          res.status(500).json({ error: 'No se pudo guardar la imagen' });
        }
      });
      req.on('error', err => {
        console.error(`[HTTP] Error recibiendo adjunto de cambios: ${err}`);
        res.status(500).json({ error: 'No se pudo guardar la imagen' });
      });
    } catch (err) {
      console.error(`[HTTP] Error guardando adjunto de cambios: ${err}`);
      res.status(500).json({ error: 'No se pudo guardar la imagen' });
    }
  });

  app.get('/api/projects/:id/files/:filename', deps.fileAuthMiddleware, (req, res) => {
    const project = deps.readDb().projects.find((p: StoredProject) => p.id === req.params.id && p.userId === (req as any).user.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    const filename = path.basename(req.params.filename);
    if (!/^logo\.(png|jpg|jpeg|webp|svg)$/i.test(filename)) return res.status(404).json({ error: 'Archivo no encontrado' });
    const filePath = safeProjectFilePath(project, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Archivo no encontrado' });
    res.sendFile(filePath);
  });

  app.get('/api/projects/:id/preview', deps.authMiddleware, (req, res) => {
    const project = deps.readDb().projects.find((p: StoredProject) => p.id === req.params.id && p.userId === (req as any).user.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    let delivery: DeliveryInfo | null = null;
    try {
      delivery = readDeliveryInfo(project);
    } catch (err) {
      deps.recordHostTurnEvent({
        projectId: project.id,
        userId: (req as any).user.id,
        sessionId: null,
        eventType: 'delivery.preview.validation_failed',
        payload: { error: err instanceof Error ? err.message : String(err) }
      });
    }
    res.json({
      project: { id: project.id, name: project.name },
      preview: {
        available: !!delivery?.previewUrl,
        url: delivery?.previewUrl || null,
        message: delivery?.previewUrl ? 'Preview listo.' : 'El preview estara disponible cuando el agente termine de construir el proyecto.'
      }
    });
  });

  app.put('/api/projects/:id', deps.authMiddleware, (req, res) => {
    const { name, description } = req.body;
    const project = deps.updateProject(req.params.id, (req as any).user.id, { name, project_name: name, description });
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(deps.publicProject(project));
  });

  app.delete('/api/projects/:id', deps.authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const project = deps.readDb().projects.find((p: StoredProject) => p.id === req.params.id && p.userId === userId);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    if (['RUNNING', 'STOPPING'].includes(deps.getExecutionState(project.id))) {
      return res.status(409).json({ error: 'No se puede eliminar un proyecto con una ejecuciÃ³n activa.' });
    }

    try {
      const motorResponse = await deps.sendMotorDeleteCommand(project);
      deps.deleteProjectRecord(project.id, userId);
      res.json({
        ok: true,
        deleted: { id: project.id, project_name: project.project_name },
        motor: { accepted: true, response: motorResponse }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      deps.recordHostTurnEvent({
        projectId: project.id,
        userId,
        sessionId: null,
        eventType: 'delete.error',
        payload: { error: message }
      });
      res.status(502).json({
        error: 'No se pudo confirmar la eliminaciÃ³n con el motor. IntentÃ¡ nuevamente en unos segundos.'
      });
    }
  });

  app.get('/api/projects/:id/download', deps.fileAuthMiddleware, async (req, res) => {
    const project = deps.readDb().projects.find((p: StoredProject) => p.id === req.params.id && p.userId === (req as any).user.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    let delivery: DeliveryInfo;
    try {
      delivery = requireDeliveryInfo(project);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      deps.recordHostTurnEvent({
        projectId: project.id,
        userId: (req as any).user.id,
        sessionId: null,
        eventType: 'delivery.download.validation_failed',
        payload: { error }
      });
      return res.status(404).json({ error: 'La entrega todavia no esta disponible.' });
    }

    if (project.status !== 'ready') {
      await deps.finalizeProjectDelivery({
        project,
        userId: (req as any).user.id,
        sessionId: null,
        source: 'download_endpoint'
      });
    }

    res.download(delivery.zipPath, path.basename(delivery.zipPath));
  });

  app.get('/api/projects/:id/history.pdf', deps.fileAuthMiddleware, (req, res) => {
    const project = deps.readDb().projects.find((p: StoredProject) => p.id === req.params.id && p.userId === (req as any).user.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    const messages = deps.getConfirmedChatMessagesForProject(project.id);
    const pdf = buildChatHistoryPdf(project, messages);
    const filename = `${(project.project_name || project.name || 'proyecto').replace(/[^\w.-]+/g, '_')}-historial.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdf);
  });

  app.get('/api/projects/:id/chat', deps.authMiddleware, (req, res) => {
    const found = deps.readDb().projects.find((p: StoredProject) => p.id === req.params.id && p.userId === (req as any).user.id);
    const project = found ? deps.closeInterviewFromFilesystem(found, (req as any).user.id) : null;
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    const history = deps.findChatHistoryForProject(project.id);
    if (history) {
      const activeHostSession = deps.hasActiveHostSessionForProject(project, history);
      res.json({
        messages: deps.getConfirmedChatMessagesForProject(project.id),
        pending_question: activeHostSession && history.pending_question?.visible !== false ? history.pending_question : null,
        requires_continue: !!history.pending_question && !activeHostSession
      });
      return;
    }
    res.json({
      messages: deps.chatMessages[req.params.id] || [],
      pending_question: null,
      requires_continue: false
    });
  });

  app.post('/api/projects/:id/chat', deps.authMiddleware, (req, res) => {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'message es requerido' });
    const project = deps.readDb().projects.find((p: StoredProject) => p.id === req.params.id && p.userId === (req as any).user.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    if (!deps.chatMessages[req.params.id]) deps.chatMessages[req.params.id] = [];
    const userMsg = { role: 'user', content: message.trim(), ts: new Date().toISOString() };
    deps.chatMessages[req.params.id].push(userMsg);
    if (project.chat_history_id) {
      deps.appendChatHistoryMessage(project.chat_history_id, (req as any).user.id, 'user', message.trim());
    }
    res.status(202).json({
      userMsg,
      delivery: 'socket-host-adapter',
      message: 'El chat interactivo se responde exclusivamente por Socket.IO mediante el HostAdapter activo.'
    });
  });

  app.post('/api/projects/:id/agent-question', (_req, res) => {
    res.status(410).json({ error: 'Endpoint legacy retirado. El flujo vigente usa Socket.IO + Codex bridge.' });
  });
}
