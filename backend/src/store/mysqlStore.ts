import mysql, { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type {
  DbShape,
  HostJobStatus,
  StoredChatHistory,
  StoredChatMessage,
  StoredProject
} from '../types/domain';

type MysqlStoreConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

type MysqlStoreDeps = {
  workspaceUserId: (userId: string) => string;
};

type HostTurnEvent = {
  projectId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  eventType: string;
  payload?: Record<string, any>;
};

type HostJobEvent = {
  projectId: string;
  userId: string;
  sessionId?: string | null;
  status: HostJobStatus;
  command?: string | null;
  response?: string | null;
  error?: string | null;
  attempts?: number;
  finished?: boolean;
  resumeAt?: string | null;
};

// Cortes transitorios de conexion (ej. blip de red entre el backend y el
// contenedor de MySQL) no deben tirar abajo procesos de larga duracion como
// los jobs de background -- un solo query fallido ahi mataba el job entero
// sin dejar nada recuperable hasta el proximo restart del backend. Reintenta
// solo errores de conexion reconocibles, nunca errores de datos/SQL real.
const TRANSIENT_DB_ERROR = /ECONNRESET|PROTOCOL_CONNECTION_LOST|ETIMEDOUT|ECONNREFUSED|EPIPE/i;

async function withDbRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      if (!TRANSIENT_DB_ERROR.test(message) || attempt === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw lastErr;
}

export function createMysqlStore(config: MysqlStoreConfig, deps: MysqlStoreDeps) {
  let dbCache: DbShape = { users: [], projects: [], chatHistories: [] };
  let dbPool: Pool | null = null;
  let persistQueue: Promise<void> = Promise.resolve();

  async function initMysqlStore() {
    dbPool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: false
    });

    for (let attempt = 1; attempt <= 30; attempt++) {
      try {
        await dbPool.query('SELECT 1');
        break;
      } catch (err) {
        if (attempt === 30) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        hash VARCHAR(255) NOT NULL,
        workspace_user_id VARCHAR(255) NULL
      )
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(80) PRIMARY KEY,
        project_id VARCHAR(80) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        chat_history_id VARCHAR(80) NULL,
        name VARCHAR(255) NOT NULL,
        project_name VARCHAR(255) NOT NULL,
        project_path TEXT NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(80) NOT NULL,
        status VARCHAR(40) NOT NULL,
        preview_url TEXT NULL,
        zip_url TEXT NULL,
        created_at DATETIME(3) NOT NULL,
        updated_at DATETIME(3) NOT NULL,
        INDEX idx_projects_user (user_id)
      )
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS chat_histories (
        id VARCHAR(80) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        project_id VARCHAR(80) NULL,
        host_session_id VARCHAR(120) NULL,
        status VARCHAR(40) NOT NULL,
        messages JSON NOT NULL,
        pending_question JSON NULL,
        pending_answer JSON NULL,
        created_at DATETIME(3) NOT NULL,
        updated_at DATETIME(3) NOT NULL,
        INDEX idx_chat_histories_user (user_id),
        INDEX idx_chat_histories_project (project_id)
      )
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS host_turn_events (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        project_id VARCHAR(80) NULL,
        user_id VARCHAR(64) NULL,
        bs_session_id VARCHAR(120) NULL,
        event_type VARCHAR(80) NOT NULL,
        payload JSON NOT NULL,
        created_at DATETIME(3) NOT NULL,
        INDEX idx_host_turn_project (project_id),
        INDEX idx_host_turn_user (user_id),
        INDEX idx_host_turn_session (bs_session_id)
      )
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS host_jobs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        project_id VARCHAR(80) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        bs_session_id VARCHAR(120) NULL,
        status VARCHAR(80) NOT NULL,
        command TEXT NULL,
        last_response TEXT NULL,
        error TEXT NULL,
        attempts INT NOT NULL DEFAULT 0,
        started_at DATETIME(3) NOT NULL,
        updated_at DATETIME(3) NOT NULL,
        finished_at DATETIME(3) NULL,
        UNIQUE KEY uniq_host_jobs_project (project_id),
        INDEX idx_host_jobs_user (user_id),
        INDEX idx_host_jobs_status (status)
      )
    `);

    // Migracion incremental: host_jobs ya existia sin esta columna en instalaciones
    // previas. Guarda cuando debe reanudarse un job frenado por rate_limited
    // (limite de uso/sesion del CLI del huesped, Claude o Codex). MySQL (a
    // diferencia de MariaDB) no soporta "ADD COLUMN IF NOT EXISTS", asi que se
    // chequea contra information_schema antes de alterar.
    const [resumeAtColumn] = await dbPool.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'host_jobs' AND COLUMN_NAME = 'resume_at'`
    );
    if (resumeAtColumn.length === 0) {
      await dbPool.query(`ALTER TABLE host_jobs ADD COLUMN resume_at DATETIME(3) NULL`);
    }

    // Adjuntos del flujo "cambios": el nombre real que llega del cliente
    // nunca se usa tal cual (puede repetirse entre turnos/clientes) — el
    // nombre que efectivamente se escribe en [PROJECT_ROOT] y se manda al
    // LLM sale siempre de esta tabla (id autoincremental), nunca de un
    // patron fijo en codigo.
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS edit_attachments (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        project_id VARCHAR(80) NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        mime VARCHAR(100) NOT NULL,
        stored_filename VARCHAR(120) NOT NULL,
        created_at DATETIME(3) NOT NULL,
        INDEX idx_edit_attachments_project (project_id)
      )
    `);

    dbCache = await loadDbFromMysql();
  }

  function isoToMysqlDate(value: string | undefined) {
    const date = value ? new Date(value) : new Date();
    return date.toISOString().slice(0, 23).replace('T', ' ');
  }

  function mysqlDateToIso(value: any) {
    if (!value) return new Date().toISOString();
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }

  function parseJsonField<T>(value: any, fallback: T): T {
    if (value == null) return fallback;
    if (typeof value === 'object') return value as T;
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  async function loadDbFromMysql(): Promise<DbShape> {
    if (!dbPool) throw new Error('MySQL store no inicializado');
    const [usersRows] = await dbPool.query<RowDataPacket[]>('SELECT * FROM users ORDER BY id');
    const [projectRows] = await dbPool.query<RowDataPacket[]>('SELECT * FROM projects ORDER BY created_at');
    const [historyRows] = await dbPool.query<RowDataPacket[]>('SELECT * FROM chat_histories ORDER BY created_at');

    return {
      users: usersRows.map(row => ({
        id: String(row.id),
        email: String(row.email),
        name: String(row.name || ''),
        hash: String(row.hash),
        workspace_user_id: row.workspace_user_id ? String(row.workspace_user_id) : undefined
      })),
      projects: projectRows.map(row => ({
        id: String(row.id),
        project_id: String(row.project_id || row.id),
        userId: String(row.user_id),
        user_id: String(row.user_id),
        chat_history_id: row.chat_history_id ? String(row.chat_history_id) : undefined,
        name: String(row.name),
        project_name: String(row.project_name || row.name),
        project_path: String(row.project_path || ''),
        description: String(row.description || ''),
        type: String(row.type || 'saas'),
        status: (row.status || 'pending') as StoredProject['status'],
        previewUrl: String(row.preview_url || ''),
        zipUrl: String(row.zip_url || ''),
        createdAt: mysqlDateToIso(row.created_at),
        updatedAt: mysqlDateToIso(row.updated_at),
        created_at: mysqlDateToIso(row.created_at),
        updated_at: mysqlDateToIso(row.updated_at)
      })),
      chatHistories: historyRows.map(row => ({
        id: String(row.id),
        userId: String(row.user_id),
        user_id: String(row.user_id),
        projectId: row.project_id ? String(row.project_id) : null,
        project_id: row.project_id ? String(row.project_id) : null,
        hostSessionId: row.host_session_id ? String(row.host_session_id) : null,
        status: (row.status || 'interview_started') as StoredChatHistory['status'],
        messages: parseJsonField<StoredChatMessage[]>(row.messages, []),
        pending_question: parseJsonField<StoredChatMessage | null>(row.pending_question, null),
        pending_answer: parseJsonField<StoredChatMessage | null>(row.pending_answer, null),
        createdAt: mysqlDateToIso(row.created_at),
        updatedAt: mysqlDateToIso(row.updated_at),
        created_at: mysqlDateToIso(row.created_at),
        updated_at: mysqlDateToIso(row.updated_at)
      }))
    };
  }

  async function persistDbSnapshot(snapshot: DbShape) {
    if (!dbPool) throw new Error('MySQL store no inicializado');
    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      const userIds = snapshot.users.map(u => u.id);
      const projectIds = snapshot.projects.map(p => p.id);
      const historyIds = snapshot.chatHistories.map(h => h.id);

      if (userIds.length) await conn.query('DELETE FROM users WHERE id NOT IN (?)', [userIds]);
      else await conn.query('DELETE FROM users');
      if (projectIds.length) await conn.query('DELETE FROM projects WHERE id NOT IN (?)', [projectIds]);
      else await conn.query('DELETE FROM projects');
      if (historyIds.length) await conn.query('DELETE FROM chat_histories WHERE id NOT IN (?)', [historyIds]);
      else await conn.query('DELETE FROM chat_histories');

      for (const user of snapshot.users) {
        await conn.query<ResultSetHeader>(
          `INSERT INTO users (id,email,name,hash,workspace_user_id)
           VALUES (?,?,?,?,?)
           ON DUPLICATE KEY UPDATE email=VALUES(email), name=VALUES(name), hash=VALUES(hash), workspace_user_id=VALUES(workspace_user_id)`,
          [user.id, user.email, user.name, user.hash, user.workspace_user_id || deps.workspaceUserId(user.id)]
        );
      }

      for (const project of snapshot.projects) {
        await conn.query<ResultSetHeader>(
          `INSERT INTO projects
            (id,project_id,user_id,chat_history_id,name,project_name,project_path,description,type,status,preview_url,zip_url,created_at,updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE
            project_id=VALUES(project_id), user_id=VALUES(user_id), chat_history_id=VALUES(chat_history_id),
            name=VALUES(name), project_name=VALUES(project_name), project_path=VALUES(project_path),
            description=VALUES(description), type=VALUES(type), status=VALUES(status),
            preview_url=VALUES(preview_url), zip_url=VALUES(zip_url), updated_at=VALUES(updated_at)`,
          [
            project.id,
            project.project_id,
            project.userId,
            project.chat_history_id || null,
            project.name,
            project.project_name,
            project.project_path,
            project.description,
            project.type,
            project.status,
            project.previewUrl || '',
            project.zipUrl || '',
            isoToMysqlDate(project.createdAt || project.created_at),
            isoToMysqlDate(project.updatedAt || project.updated_at)
          ]
        );
      }

      for (const history of snapshot.chatHistories) {
        await conn.query<ResultSetHeader>(
          `INSERT INTO chat_histories
            (id,user_id,project_id,host_session_id,status,messages,pending_question,pending_answer,created_at,updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)
           ON DUPLICATE KEY UPDATE
            user_id=VALUES(user_id), project_id=VALUES(project_id), host_session_id=VALUES(host_session_id),
            status=VALUES(status), messages=VALUES(messages), pending_question=VALUES(pending_question),
            pending_answer=VALUES(pending_answer), updated_at=VALUES(updated_at)`,
          [
            history.id,
            history.userId,
            history.projectId || null,
            history.hostSessionId || null,
            history.status,
            JSON.stringify(history.messages || []),
            history.pending_question ? JSON.stringify(history.pending_question) : null,
            history.pending_answer ? JSON.stringify(history.pending_answer) : null,
            isoToMysqlDate(history.createdAt || history.created_at),
            isoToMysqlDate(history.updatedAt || history.updated_at)
          ]
        );
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  function readDb(): DbShape {
    const db = dbCache;
    return {
      users: db.users || [],
      projects: db.projects || [],
      chatHistories: (db.chatHistories || []).map(history => ({
        ...history,
        pending_question: history.pending_question || null,
        pending_answer: history.pending_answer || null
      }))
    };
  }

  function writeDb(db: DbShape) {
    dbCache = {
      users: db.users || [],
      projects: db.projects || [],
      chatHistories: (db.chatHistories || []).map(history => ({
        ...history,
        pending_question: history.pending_question || null,
        pending_answer: history.pending_answer || null
      }))
    };
    const snapshot = JSON.parse(JSON.stringify(dbCache)) as DbShape;
    persistQueue = persistQueue
      .then(() => persistDbSnapshot(snapshot))
      .catch(err => {
        console.error(`[DB] Error persistiendo en MySQL: ${err instanceof Error ? err.message : String(err)}`);
      });
  }

  function recordHostTurnEvent(event: HostTurnEvent) {
    if (!dbPool) return;
    const payload = JSON.stringify(event.payload || {});
    withDbRetry(() => dbPool!.query(
      `INSERT INTO host_turn_events
        (project_id,user_id,bs_session_id,event_type,payload,created_at)
       VALUES (?,?,?,?,?,?)`,
      [
        event.projectId || null,
        event.userId || null,
        event.sessionId || null,
        event.eventType,
        payload,
        isoToMysqlDate(new Date().toISOString())
      ]
    )).catch(err => {
      console.error(`[TRACE] Error persistiendo evento host: ${err instanceof Error ? err.message : String(err)}`);
    });
  }

  async function upsertHostJob(event: HostJobEvent) {
    if (!dbPool) return;
    const now = isoToMysqlDate(new Date().toISOString());
    await withDbRetry(() => dbPool!.query(
      `INSERT INTO host_jobs
        (project_id,user_id,bs_session_id,status,command,last_response,error,attempts,started_at,updated_at,finished_at,resume_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
        user_id=VALUES(user_id),
        bs_session_id=VALUES(bs_session_id),
        status=VALUES(status),
        command=VALUES(command),
        last_response=VALUES(last_response),
        error=VALUES(error),
        attempts=VALUES(attempts),
        updated_at=VALUES(updated_at),
        finished_at=VALUES(finished_at),
        resume_at=VALUES(resume_at)`,
      [
        event.projectId,
        event.userId,
        event.sessionId || null,
        event.status,
        event.command || null,
        event.response ? event.response.slice(0, 65000) : null,
        event.error ? event.error.slice(0, 65000) : null,
        event.attempts || 0,
        now,
        now,
        event.finished ? now : null,
        event.resumeAt ? isoToMysqlDate(event.resumeAt) : null
      ]
    ));
  }

  async function getHostJob(projectId: string): Promise<(RowDataPacket & {
    project_id: string;
    user_id: string;
    bs_session_id: string | null;
    status: string;
    command: string | null;
    attempts: number;
    resume_at: string | null;
  }) | null> {
    if (!dbPool) return null;
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT project_id,user_id,bs_session_id,status,command,attempts,resume_at
       FROM host_jobs
       WHERE project_id = ?
       LIMIT 1`,
      [projectId]
    );
    return (rows[0] as any) || null;
  }

  // A diferencia de un job de construccion (se filtra por project.status==='building',
  // barato en memoria), un proyecto en edicion se queda en status='ready' todo
  // el tiempo — la unica fuente de verdad de si hay una edicion en curso es
  // esta fila de host_jobs, asi que el recovery al bootear consulta la tabla
  // directo en vez de iterar todos los proyectos.
  async function getActiveEditJobs(): Promise<Array<{ project_id: string; user_id: string; status: string; resume_at: string | null }>> {
    if (!dbPool) return [];
    const [rows] = await dbPool.query<RowDataPacket[]>(
      `SELECT project_id, user_id, status, resume_at
       FROM host_jobs
       WHERE status LIKE 'edit\\_%' AND status NOT IN ('edit_done','edit_failed')`
    );
    return rows as any;
  }

  // El nombre en disco (stored_filename) sale del id autoincremental de esta
  // misma fila — nunca del nombre original que mando el cliente (que puede
  // repetirse entre turnos) ni de un patron fijo escrito en codigo. Es el
  // unico lugar que decide ese nombre; el endpoint HTTP y el mensaje que se
  // arma para el LLM lo leen de aca, nunca lo recalculan.
  async function insertEditAttachment(args: {
    projectId: string;
    userId: string;
    originalFilename: string;
    mime: string;
    ext: string;
  }): Promise<{ id: number; storedFilename: string }> {
    if (!dbPool) throw new Error('DB no inicializada');
    const now = isoToMysqlDate(new Date().toISOString());
    const [result] = await dbPool.query<ResultSetHeader>(
      `INSERT INTO edit_attachments
        (project_id,user_id,original_filename,mime,stored_filename,created_at)
       VALUES (?,?,?,?,?,?)`,
      [args.projectId, args.userId, args.originalFilename.slice(0, 255), args.mime, '', now]
    );
    const id = result.insertId;
    const storedFilename = `edit_${id}.${args.ext}`;
    await dbPool.query(
      `UPDATE edit_attachments SET stored_filename = ? WHERE id = ?`,
      [storedFilename, id]
    );
    return { id, storedFilename };
  }

  return {
    getActiveEditJobs,
    getHostJob,
    insertEditAttachment,
    initMysqlStore,
    readDb,
    recordHostTurnEvent,
    upsertHostJob,
    writeDb
  };
}
