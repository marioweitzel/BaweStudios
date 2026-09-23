import type { StoredChatMessage, StoredProject } from '../types/domain';

function sanitizePdfText(value: string) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, char => {
      const normalized = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

function buildLines(project: StoredProject, messages: StoredChatMessage[]) {
  const lines = [
    `BaweStudio - Historial del proyecto ${project.project_name || project.name}`,
    `Proyecto: ${project.project_name || project.name}`,
    `Generado: ${new Date().toISOString()}`,
    ''
  ];

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

function pageContent(lines: string[]) {
  const escapedLines = lines.map(line => `(${sanitizePdfText(line)}) Tj`);
  return [
    'BT',
    '/F1 10 Tf',
    '50 790 Td',
    '14 TL',
    escapedLines.join('\nT*\n'),
    'ET'
  ].join('\n');
}

export function buildChatHistoryPdf(project: StoredProject, messages: StoredChatMessage[]) {
  const allLines = buildLines(project, messages);
  const pages: string[][] = [];
  for (let i = 0; i < allLines.length; i += 48) {
    pages.push(allLines.slice(i, i + 48));
  }
  if (!pages.length) pages.push([]);

  const objects: string[] = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  const pageObjectNumbers = pages.map((_, index) => 3 + index * 2);
  objects.push(`<< /Type /Pages /Kids [${pageObjectNumbers.map(num => `${num} 0 R`).join(' ')}] /Count ${pages.length} >>`);

  pages.forEach((lines, index) => {
    const pageObj = 3 + index * 2;
    const contentObj = pageObj + 1;
    const content = pageContent(lines);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentObj} 0 R >>`);
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
