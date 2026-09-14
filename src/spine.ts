import { type AttachmentLoader, SkeletonBinary } from '@esotericsoftware/spine-core';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { diffNames } from './scan.js';
import type { SkeletonDiff, SkeletonNames } from './types.js';

const EMPTY_ATTACHMENT_LOADER = {
  newRegionAttachment: () => null,
  newMeshAttachment: () => null,
  newBoundingBoxAttachment: () => null,
  newPathAttachment: () => null,
  newPointAttachment: () => null,
  newClippingAttachment: () => null,
} as unknown as AttachmentLoader;

const SPINE_EXTENSIONS = ['.json', '.skel'];

interface RawSkeleton {
  skeleton?: { spine?: string };
  animations?: Record<string, unknown>;
  slots?: { name?: string }[];
}

export function isSpineFile(path: string): boolean {
  return SPINE_EXTENSIONS.some((extension) => path.endsWith(extension));
}

export async function readSkeletonNames(root: string, path: string): Promise<SkeletonNames | null> {
  if (path.endsWith('.skel')) return readBinarySkeletonNames(root, path);

  const content = await readFile(join(root, path), 'utf8');

  let raw: RawSkeleton;
  try {
    raw = JSON.parse(content) as RawSkeleton;
  } catch {
    return null;
  }

  if (!raw.animations && !raw.slots) return null;

  return {
    file: path,
    spineVersion: raw.skeleton?.spine ?? '',
    animations: Object.keys(raw.animations ?? {}),
    slots: (raw.slots ?? []).map((slot) => slot.name ?? '').filter(Boolean),
  };
}

async function readBinarySkeletonNames(root: string, path: string): Promise<SkeletonNames | null> {
  const bytes = await readFile(join(root, path));

  try {
    const data = new SkeletonBinary(EMPTY_ATTACHMENT_LOADER).readSkeletonData(new Uint8Array(bytes));
    return {
      file: path,
      spineVersion: data.version ?? '',
      animations: data.animations.map((animation) => animation.name),
      slots: data.slots.map((slot) => slot.name),
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`could not read ${path}: ${reason}. Export it to JSON instead.`);
    return null;
  }
}

export function diffSkeletons(base: SkeletonNames, reskin: SkeletonNames): SkeletonDiff | null {
  const animations = diffNames(new Set(base.animations), new Set(reskin.animations));
  const slots = diffNames(new Set(base.slots), new Set(reskin.slots));

  const versionMismatch =
    base.spineVersion && reskin.spineVersion && base.spineVersion !== reskin.spineVersion
      ? ([base.spineVersion, reskin.spineVersion] as [string, string])
      : undefined;

  const hasFindings =
    animations.missing.length > 0 ||
    animations.extra.length > 0 ||
    slots.missing.length > 0 ||
    slots.extra.length > 0 ||
    versionMismatch !== undefined;

  if (!hasFindings) return null;

  return { file: base.file, versionMismatch, animations, slots };
}
