/** Shared catalog ordering — admin list and shop home use the same sequence. */
export function compareCatalogs(
  a: { sortOrder: number; name: string },
  b: { sortOrder: number; name: string },
): number {
  const byOrder = a.sortOrder - b.sortOrder;
  if (byOrder !== 0) return byOrder;
  return a.name.localeCompare(b.name);
}
