import { runNpm } from "../utils/runner.js";
import chalk from "chalk";

export async function removePackage(packages) {
  if (!packages || packages.length === 0) {
    console.log(chalk.yellow("Please provide a package name."));
    return;
  }

  await runNpm(["uninstall", ...packages]);
}
