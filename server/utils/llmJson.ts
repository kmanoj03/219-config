// In order to return the results from the model properly.

export function extractAndParseJson(raw: string): any | null {
  try {
    const s = raw.replace(/```json|```/gi, "").trim();
    try {
      return JSON.parse(s);
    } catch {}
    const first = s.indexOf("{");
    const last = s.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(s.slice(first, last + 1));
    }
  } catch {}
  return null;
}

export async function parseWithRepair(
  raw: string,
  repairFn: (badText: string) => Promise<string>
): Promise<any | null> {
  const direct = extractAndParseJson(raw);
  if (direct) return direct;
  const repaired = await repairFn(raw);
  return extractAndParseJson(repaired);
}
