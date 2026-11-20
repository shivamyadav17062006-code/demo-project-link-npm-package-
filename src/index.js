#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";

import { startMenu } from "./utils/menu.js";
import { installPackage } from "./commands/install.js";
import { removePackage } from "./commands/remove.js";
import { listPackages } from "./commands/list.js";
import { startDashboard } from "./commands/dashboard.js";
import { explainConcept } from "./learning/concepts.js";
import { startQuiz } from "./learning/quiz.js";
import { runNpm } from "./utils/runner.js";

const program = new Command();

program
  .name("npm-buddy")
  .description(
    "Your friendly NPM package manager and learning assistant"
  )
  .version("1.1.0");

program
  .command("install <packages...>")
  .option("--dev", "Install as devDependency")
  .description("Install packages")
  .action(installPackage);

program
  .command("remove <packages...>")
  .description("Remove packages")
  .action(removePackage);

program
  .command("list")
  .description("List installed packages")
  .action(listPackages);

program
  .command("outdated")
  .description("Check outdated packages")
  .action(() => runNpm(["outdated"], { allowExitCodes: [1] }));

program
  .command("audit")
  .description("Check package vulnerabilities")
  .action(() => runNpm(["audit"], { allowExitCodes: [1] }));

program
  .command("explain <topic>")
  .description("Explain NPM concepts")
  .action(explainConcept);

program
  .command("learn")
  .description("Start the NPM learning quiz")
  .action(startQuiz);

program
  .command("doctor")
  .description("Check Node.js and NPM versions")
  .action(async () => {
    console.log(chalk.cyan("\nEnvironment check"));

    console.log("Node.js:", process.version);

    await runNpm(["--version"]);
  });

program
  .command("menu")
  .description("Open interactive menu")
  .action(startMenu);

program
  .command("dashboard")
  .description("Open the visual dashboard for the current project")
  .action(startDashboard);

async function main() {
  if (process.argv.length === 2) {
    await startMenu();
  } else {
    await program.parseAsync(process.argv);
  }
}

main().catch((error) => {
  if (error?.name === "ExitPromptError") {
    console.log(chalk.green("\nHappy coding!"));
    return;
  }

  console.error(chalk.red(error.message));
  process.exitCode = 1;
});
