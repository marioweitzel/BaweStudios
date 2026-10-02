import nodemailer from 'nodemailer';
import { env } from '../config/env';
import type { StoredProject, StoredUser } from '../types/domain';

export type DeliveryMailKind = 'project' | 'edit';

type DeliveryMailDeps = {
  findUserById: (id: string | null | undefined) => StoredUser | null;
  recordHostTurnEvent: (event: {
    projectId: string;
    userId: string;
    sessionId?: string | null;
    eventType: string;
    payload?: Record<string, unknown>;
  }) => void;
};

function oneLine(value: string | null | undefined) {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

// Sin "https://": el mail no lleva enlaces, el cliente escribe la direccion en
// el navegador (proteccion contra correos falsos que imitan el aviso).
function displayAddress(url: string) {
  return String(url || '').trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').replace(/\/+$/, '');
}

export function buildDeliveryMail(args: { kind: DeliveryMailKind; userName: string; projectName: string; baseUrl: string }) {
  const word = args.kind === 'edit' ? 'edición' : 'proyecto';
  const greeting = args.userName ? `Hola ${args.userName},` : 'Hola,';
  const subject = args.kind === 'edit' ? 'Tu edición finalizó' : 'Tu proyecto finalizó';
  const text = [
    greeting,
    '',
    `Tu ${word} "${args.projectName}" finalizó.`,
    '',
    'Ya podés verlo:',
    `1. Abrí tu navegador y escribí: ${displayAddress(args.baseUrl)}`,
    '2. Iniciá sesión y andá a la sección "Proyectos".',
    '3. Ahí vas a encontrar tu web para probarla y el archivo ZIP para descargarla.',
    '',
    'Si querés pedir un cambio, hacelo desde el mismo lugar: "Preview" → "Editar".',
    '',
    'Si necesitás una guía para publicar tu web en tu propio servidor o computadora, usá el botón "Soporte".',
    '',
    'Por tu seguridad: BaweStudio nunca te pide que hagas clic en enlaces',
    'de un correo. Si ves un enlace en este mensaje, no lo uses: entrá siempre',
    'escribiendo la dirección directamente en tu navegador.',
    '',
    'Gracias por confiar en BaweStudio.',
    '',
    '—',
    'Este es un mensaje automático enviado desde una dirección que no recibe',
    'correo. Por favor, no respondas a este mensaje.',
    ''
  ].join('\n');
  return { subject, text };
}

export function createDeliveryMailService(deps: DeliveryMailDeps) {
  const cfg = env.mail;
  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: false,
    ignoreTLS: true,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000
  });

  // Nunca lanza: un fallo de correo no puede romper la entrega del proyecto.
  async function notifyDeliveryFinished(args: {
    kind: DeliveryMailKind;
    project: StoredProject;
    userId: string;
    sessionId?: string | null;
  }): Promise<void> {
    const base = { projectId: args.project.id, userId: args.userId, sessionId: args.sessionId || null };
    try {
      if (!cfg.appUrl) {
        deps.recordHostTurnEvent({ ...base, eventType: 'delivery.mail.skipped', payload: { kind: args.kind, reason: 'sin BAWE_APP_URL' } });
        return;
      }
      const user = deps.findUserById(args.userId);
      if (!user?.email) {
        deps.recordHostTurnEvent({ ...base, eventType: 'delivery.mail.skipped', payload: { kind: args.kind, reason: 'usuario sin correo' } });
        return;
      }
      const { subject, text } = buildDeliveryMail({
        kind: args.kind,
        userName: oneLine(user.name),
        projectName: oneLine(args.project.name || args.project.project_name),
        baseUrl: cfg.appUrl
      });
      const info = await transport.sendMail({
        from: { name: cfg.fromName, address: cfg.fromAddress },
        envelope: { from: cfg.fromAddress, to: user.email },
        to: user.email,
        subject,
        text
      });
      deps.recordHostTurnEvent({ ...base, eventType: 'delivery.mail.sent', payload: { kind: args.kind, response: String(info.response || '').slice(0, 200) } });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[Mail] No se pudo enviar el aviso (${args.kind}) del proyecto ${args.project.id}: ${error}`);
      try {
        deps.recordHostTurnEvent({ ...base, eventType: 'delivery.mail.failed', payload: { kind: args.kind, error: error.slice(0, 300) } });
      } catch {
        // El registro de auditoria tampoco puede romper la entrega.
      }
    }
  }

  return { notifyDeliveryFinished };
}
