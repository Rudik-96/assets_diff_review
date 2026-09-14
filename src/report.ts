import colors from 'picocolors';
import type { DiffReport, NameDiff } from './types.js';

const INDENT = '  ';

function printList(title: string, names: string[], paint: (text: string) => string): void {
  if (names.length === 0) return;
  console.log(paint(title));
  for (const name of names) console.log(`${INDENT}${name}`);
  console.log('');
}

function printNested(title: string, diff: NameDiff, verbose: boolean): void {
  if (diff.missing.length > 0) {
    console.log(`${INDENT}${colors.red(`missing ${title}:`)} ${diff.missing.join(', ')}`);
  }
  if (verbose && diff.extra.length > 0) {
    console.log(`${INDENT}${colors.yellow(`extra ${title}:`)} ${diff.extra.join(', ')}`);
  }
}

export function printReport(report: DiffReport, verbose: boolean): void {
  const { errors, warnings } = report.summary;

  console.log('');
  console.log(`${colors.red(`${errors} errors`)}, ${colors.yellow(`${warnings} warnings`)}`);
  console.log('');

  printList('ERROR  missing files', report.files.missing, colors.red);
  if (verbose) printList('WARN  extra files', report.files.extra, colors.yellow);

  for (const skeleton of report.skeletons) {
    const hasErrors =
      skeleton.animations.missing.length > 0 || skeleton.slots.missing.length > 0 || skeleton.versionMismatch;

    if (!hasErrors && !verbose) continue;

    console.log(colors.bold(skeleton.file));
    if (skeleton.versionMismatch) {
      const [baseVersion, reskinVersion] = skeleton.versionMismatch;
      console.log(`${INDENT}${colors.yellow(`spine version: ${baseVersion} vs ${reskinVersion}`)}`);
    }
    printNested('animations', skeleton.animations, verbose);
    printNested('slots', skeleton.slots, verbose);
    console.log('');
  }

  if (errors === 0 && warnings === 0) console.log(colors.green('packs match'));

  if (!verbose && warnings > 0) console.log(colors.dim('run with --verbose to see warnings'));
}
