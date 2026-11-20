import { runNpm } from "../utils/runner.js";
import chalk from "chalk";

export async function installPackage(packages, options = {}) {
  if (!packages || packages.length === 0) {
    console.log(chalk.yellow("Enter a package name."));
    return;
  }

  const args = ["install", ...packages];

  if (options.dev) {
    args.push("--save-dev");
  }

  await runNpm(args);
}
