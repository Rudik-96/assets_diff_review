export interface SkeletonNames {
  file: string;
  spineVersion: string;
  animations: string[];
  slots: string[];
}

export interface NameDiff {
  missing: string[];
  extra: string[];
}

export interface SkeletonDiff {
  file: string;
  versionMismatch?: [string, string];
  animations: NameDiff;
  slots: NameDiff;
}

export interface DiffReport {
  meta: { base: string; reskin: string };
  files: NameDiff;
  skeletons: SkeletonDiff[];
  summary: { errors: number; warnings: number };
}
