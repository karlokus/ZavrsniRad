export function formatApiMessage(msg: unknown): string {
  if (typeof msg === 'string' && msg.trim().length > 0) return msg;
  if (Array.isArray(msg)) {
    const lines = msg.filter((m): m is string => typeof m === 'string' && m.length > 0);
    if (lines.length > 0) return lines.join('\n');
  }
  return 'Nepoznata pogreška';
}
