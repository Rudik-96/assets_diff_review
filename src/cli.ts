#!/usr/bin/env node

import { Command } from "commander";
import { buildReport } from "./diff.js";
import { printReport } from "./report.js";
import { DEFAULT_IGNORE } from "./scan.js";

interface CliOptions {
  ignore: string[];
  verbose: boolean;
  json: boolean;
  failOn: "error" | "warning" | "never";
}

const program = new Command();

program
  .name("asset-diff")
  .description("Compares a base asset pack against a reskin candidate by names")
  .argument("<base>", "reference pack")
  .argument("<reskin>", "candidate pack")
  .option("--ignore <names...>", "extra file names to skip", [])
  .option("--verbose", "show warnings too", false)
  .option("--json", "print the raw report", false)
  .option("--fail-on <level>", "error | warning | never", "error")
  .action(async (base: string, reskin: string, options: CliOptions) => {
    let report: Awaited<ReturnType<typeof buildReport>>;
    try {
      report = await buildReport(base, reskin, [
        ...DEFAULT_IGNORE,
        ...options.ignore,
      ]);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(2);
    }

    // if (options.json) {
    //   console.log(JSON.stringify(report, null, 2));
    // } else {
    //   printReport(report, options.verbose);
    // }

    const { errors, warnings } = report.summary;
    const failed =
      (options.failOn === "error" && errors > 0) ||
      (options.failOn === "warning" && errors + warnings > 0);
    process.exit(failed ? 1 : 0);
  });

program.parse();
