/** Splits on `\n` or `\r\n`; one trailing line break does not add an empty last line. */
export function splitLines(s: string): string[] {
  if (s === '') return [];
  const lines = s.split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop();
  return lines;
}
