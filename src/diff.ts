import { diffNames, scan } from "./scan.js";
import { diffSkeletons, isSpineFile, readSkeletonNames } from "./spine.js";
import type { DiffReport, SkeletonDiff } from "./types.js";

export async function buildReport(
  base: string,
  reskin: string,
  ignore: string[],
): Promise<DiffReport> {
  const [basePaths, reskinPaths] = await Promise.all([
    scan(base, ignore),
    scan(reskin, ignore),
  ]);

  const files = diffNames(basePaths, reskinPaths);

  const common = [...basePaths].filter((path) => reskinPaths.has(path)).sort();

  const skeletons: SkeletonDiff[] = [];
  for (const path of common.filter(isSpineFile)) {
    const [baseNames, reskinNames] = await Promise.all([
      readSkeletonNames(base, path),
      readSkeletonNames(reskin, path),
    ]);

    if (!baseNames || !reskinNames) continue;

    const diff = diffSkeletons(baseNames, reskinNames);
    if (diff) skeletons.push(diff);
  }

  const errors =
    files.missing.length +
    skeletons.reduce(
      (sum, item) =>
        sum + item.animations.missing.length + item.slots.missing.length,
      0,
    );

  const warnings =
    files.extra.length +
    skeletons.reduce(
      (sum, item) =>
        sum + item.animations.extra.length + item.slots.extra.length,
      0,
    );

  return {
    meta: { base, reskin },
    files,
    skeletons,
    summary: { errors, warnings },
  };
}
