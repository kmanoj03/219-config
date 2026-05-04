// Hitting the target lines straight and hard ; for better UI showup and help in showing the diff
// Although caveats do exist, can improve on this as we move.

export function findLineRange(
  text: string,
  re: RegExp
): [number, number] | undefined {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) return [i + 1, i + 1]; // single-line hit; expand later if needed
  }
}
