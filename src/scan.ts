import { readdir } from "node:fs/promises";
import { relative, sep } from "node:path";

export const DEFAULT_IGNORE = [".DS_Store", "Thumbs.db", ".git"];

export async function scan(
  root: string,
  ignore: string[] = DEFAULT_IGNORE,
): Promise<Set<string>> {
  const entries = await readdir(root, { recursive: true, withFileTypes: true });

  const paths = new Set<string>();

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const absolute = `${entry.parentPath}${sep}${entry.name}`;

    const path = relative(root, absolute).split(sep).join("/");

    if (
      ignore.some(
        (pattern) => path === pattern || path.split("/").includes(pattern),
      )
    )
      continue;

    paths.add(path);
  }

  return paths;
}

export function diffNames(
  base: Set<string>,
  reskin: Set<string>,
): { missing: string[]; extra: string[] } {
  const missing = [...base].filter((name) => !reskin.has(name)).sort();
  const extra = [...reskin].filter((name) => !base.has(name)).sort();
  return { missing, extra };
}
