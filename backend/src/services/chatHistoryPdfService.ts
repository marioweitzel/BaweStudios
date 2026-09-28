import type { StoredChatMessage, StoredProject } from '../types/domain';

// Layout fijo del "papel membretado" que se repite en cada hoja -- ver
// buildChatHistoryPdf para como se arma alrededor de esto. Coordenadas en
// puntos PDF (origen abajo-izquierda), pagina 612x842.
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 842;
const FRAME_MARGIN = 30;
const CONTENT_LEFT = 46;
const CONTENT_RIGHT = PAGE_WIDTH - FRAME_MARGIN - 16;
const LOGO_BOX = { x: 46, y: 766, w: 46, h: 36 };
const HEADER_RULE_Y = 758;
const FOOTER_RULE_Y = 46;
const BODY_LINE_HEIGHT = 13;
const BODY_TOP_MARGIN = 12; // separacion entre la regla del header y la primera linea de contenido

function sanitizePdfText(value: string) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, char => {
      const normalized = char.normalize('NFD').replace(/[̀-ͯ]/g, '');
      return /^[\x20-\x7E]$/.test(normalized) ? normalized : '?';
    })
    .replace(/[()\\]/g, '\\$&');
}

function wrapText(value: string, maxChars: number) {
  const result: string[] = [];
  for (const rawLine of String(value || '').split('\n')) {
    const words = rawLine.split(/\s+/).filter(Boolean);
    if (!words.length) {
      result.push('');
      continue;
    }
    let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars && line) {
        result.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) result.push(line);
  }
  return result;
}

function messageLabel(message: StoredChatMessage) {
  if (message.sender === 'user') return 'Cliente';
  if (message.sender === 'agent') return 'BaweStudio';
  return 'Sistema';
}

function buildBodyLines(messages: StoredChatMessage[]) {
  const lines: string[] = [];
  for (const message of messages) {
    const timestamp = message.timestamp ? new Date(message.timestamp).toLocaleString('es-AR') : '';
    lines.push(`${messageLabel(message)}${timestamp ? ` - ${timestamp}` : ''}`);
    lines.push(...wrapText(message.text || '', 88));
    if (message.attachment?.filename) {
      lines.push(`Adjunto: ${message.attachment.filename}`);
    }
    lines.push('');
  }
  if (!messages.length) lines.push('No hay mensajes confirmados para este proyecto.');
  return lines;
}

function formatAcceptedAt(value: string | null | undefined) {
  if (!value) return 'pendiente de confirmacion';
  try {
    return new Date(value).toLocaleString('es-AR');
  } catch {
    return 'pendiente de confirmacion';
  }
}

// Texto fijo de respaldo: BaweStudio solo construye sitios web (nunca apps
// instalables) y el resultado depende del detalle que dio el cliente durante
// la entrevista. Se imprime en CADA hoja, no solo la primera -- ver pedido de
// Mario (26/9/2026): sirve de respaldo ante reclamos, no alcanza con que
// aparezca una sola vez al principio del documento.
function buildDisclaimerLines(scopeDisclaimerAcceptedAt: string | null | undefined) {
  const notice = 'BaweStudio construye sitios web responsive (nunca aplicaciones instalables tipo APK/IPA). '
    + 'El resultado final depende directamente del nivel de detalle que el cliente brindo durante la entrevista, '
    + 'incluso usando lenguaje simple y no tecnico.';
  return [
    `Alcance aceptado por el cliente: ${formatAcceptedAt(scopeDisclaimerAcceptedAt)}`,
    ...wrapText(notice, 108)
  ];
}

// Operadores graficos crudos (sin libreria) para el "papel membretado":
// marco de la hoja, caja vacia reservada para el isotipo futuro, wordmark,
// nombre del proyecto, regla del header y regla del footer. Todo esto va
// AFUERA de bloques BT/ET (son ops de grafica, no de texto).
function letterheadGraphics() {
  return [
    'q',
    '0.55 0.55 0.55 RG',
    '1 w',
    `${FRAME_MARGIN} ${FRAME_MARGIN} ${PAGE_WIDTH - FRAME_MARGIN * 2} ${PAGE_HEIGHT - FRAME_MARGIN * 2} re S`,
    '0.7 0.7 0.7 RG',
    '[2 2] 0 d',
    `${LOGO_BOX.x} ${LOGO_BOX.y} ${LOGO_BOX.w} ${LOGO_BOX.h} re S`,
    '[] 0 d',
    '0.4 0.4 0.4 RG',
    `${CONTENT_LEFT} ${HEADER_RULE_Y} m ${CONTENT_RIGHT} ${HEADER_RULE_Y} l S`,
    `${CONTENT_LEFT} ${FOOTER_RULE_Y} m ${CONTENT_RIGHT} ${FOOTER_RULE_Y} l S`,
    'Q'
  ].join('\n');
}

function letterheadText(projectName: string) {
  const logoLabel = 'ISOTIPO';
  const logoLabelX = LOGO_BOX.x + LOGO_BOX.w / 2 - (logoLabel.length * 3.6) / 2;
  return [
    'BT',
    '0.65 0.65 0.65 rg',
    '/F1 6 Tf',
    `${logoLabelX} ${LOGO_BOX.y + LOGO_BOX.h / 2 - 3} Td`,
    `(${logoLabel}) Tj`,
    'ET',
    'BT',
    '0.1 0.1 0.1 rg',
    '/F2 16 Tf',
    `${LOGO_BOX.x + LOGO_BOX.w + 12} 793 Td`,
    '(BaweStudio) Tj',
    'ET',
    'BT',
    '0.2 0.2 0.2 rg',
    '/F1 10 Tf',
    `${LOGO_BOX.x + LOGO_BOX.w + 12} 777 Td`,
    `(Historial del proyecto: ${sanitizePdfText(projectName)}) Tj`,
    'ET'
  ].join('\n');
}

function disclaimerText(lines: string[]) {
  const startY = HEADER_RULE_Y - 14;
  const escapedLines = lines.map(line => `(${sanitizePdfText(line)}) Tj`);
  return [
    'BT',
    '0.35 0.35 0.35 rg',
    '/F3 8 Tf',
    `${CONTENT_LEFT} ${startY} Td`,
    '10 TL',
    escapedLines.join('\nT*\n'),
    'ET'
  ].join('\n');
}

function footerText(pageNumber: number, totalPages: number) {
  const label = `Pagina ${pageNumber} de ${totalPages}`;
  return [
    'BT',
    '0.4 0.4 0.4 rg',
    '/F1 8 Tf',
    `${(PAGE_WIDTH - label.length * 3.9) / 2} ${FOOTER_RULE_Y - 14} Td`,
    `(${label}) Tj`,
    'ET'
  ].join('\n');
}

function bodyText(lines: string[], startY: number) {
  if (!lines.length) return '';
  const escapedLines = lines.map(line => `(${sanitizePdfText(line)}) Tj`);
  return [
    'BT',
    '0 0 0 rg',
    '/F1 10 Tf',
    `${CONTENT_LEFT} ${startY} Td`,
    `${BODY_LINE_HEIGHT} TL`,
    escapedLines.join('\nT*\n'),
    'ET'
  ].join('\n');
}

export function buildChatHistoryPdf(
  project: StoredProject,
  messages: StoredChatMessage[],
  options: { scopeDisclaimerAcceptedAt?: string | null } = {}
) {
  const projectName = project.project_name || project.name;
  const disclaimerLines = buildDisclaimerLines(options.scopeDisclaimerAcceptedAt);
  const bodyStartY = HEADER_RULE_Y - 14 - disclaimerLines.length * 10 - BODY_TOP_MARGIN;
  const bodyLinesPerPage = Math.max(10, Math.floor((bodyStartY - (FOOTER_RULE_Y + 20)) / BODY_LINE_HEIGHT));

  const allBodyLines = buildBodyLines(messages);
  const bodyPages: string[][] = [];
  for (let i = 0; i < allBodyLines.length; i += bodyLinesPerPage) {
    bodyPages.push(allBodyLines.slice(i, i + bodyLinesPerPage));
  }
  if (!bodyPages.length) bodyPages.push([]);

  const objects: string[] = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  const pageObjectNumbers = bodyPages.map((_, index) => 3 + index * 2);
  objects.push(`<< /Type /Pages /Kids [${pageObjectNumbers.map(num => `${num} 0 R`).join(' ')}] /Count ${bodyPages.length} >>`);

  bodyPages.forEach((lines, index) => {
    const pageObj = 3 + index * 2;
    const contentObj = pageObj + 1;
    const content = [
      letterheadGraphics(),
      letterheadText(projectName),
      disclaimerText(disclaimerLines),
      bodyText(lines, bodyStartY),
      footerText(index + 1, bodyPages.length)
    ].join('\n');
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] `
      + '/Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> '
      + '/F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> '
      + '/F3 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >> >> >> '
      + `/Contents ${contentObj} 0 R >>`
    );
    objects.push(`<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}
