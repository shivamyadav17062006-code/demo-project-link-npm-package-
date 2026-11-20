#!/usr/bin/env node

import { execa } from "execa";
import chalk from "chalk";

export async function runNpm(args, { allowExitCodes = [] } = {}) {
  console.log(chalk.cyan(`\n$ npm ${args.join(" ")}\n`));

  try {
    const result = await execa("npm", args, {
      stdio: "inherit",
      reject: false
    });

    if (
      result.exitCode !== 0 &&
      !allowExitCodes.includes(result.exitCode)
    ) {
      console.log(chalk.red("\n✗ NPM command failed!"));
      console.log(
        chalk.yellow("Check the error above and try again.")
      );

      return false;
    }

    console.log(chalk.green("\n✓ Operation completed!"));

    return true;
  } catch (error) {
    console.log(chalk.red("\n✗ Could not run npm."));
    console.log(
      chalk.yellow(
        "Make sure Node.js and NPM are installed and on your PATH."
      )
    );

    return false;
  }
}
