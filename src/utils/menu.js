import inquirer from "inquirer";
import chalk from "chalk";

import { installPackage } from "../commands/install.js";
import { removePackage } from "../commands/remove.js";
import { listPackages } from "../commands/list.js";
import {
  explainConcept,
  listTopics
} from "../learning/concepts.js";
import { startQuiz } from "../learning/quiz.js";
import { startDashboard } from "../commands/dashboard.js";
import { runNpm } from "./runner.js";

async function askPackage() {
  const { packages } = await inquirer.prompt([
    {
      type: "input",
      name: "packages",
      message: "Enter package names (space separated):"
    }
  ]);

  return packages.trim().split(/\s+/).filter(Boolean);
}

export async function startMenu() {
  console.log(
    chalk.green.bold("\nWelcome to npm-buddy!\n")
  );

  let running = true;

  while (running) {
    const { action } = await inquirer.prompt([
      {
        type: "select",
        name: "action",
        message: "What would you like to do?",
        choices: [
          "Install a package",
          "Remove a package",
          "List installed packages",
          "Check outdated packages",
          "Check security vulnerabilities",
          "Explain NPM concepts",
          "Learn NPM interactively",
          "Open the visual dashboard",
          "Exit"
        ],
        pageSize: 10
      }
    ]);

    switch (action) {
      case "Install a package": {
        const packages = await askPackage();

        const { dev } = await inquirer.prompt([
          {
            type: "confirm",
            name: "dev",
            message: "Install as devDependency?",
            default: false
          }
        ]);

        await installPackage(packages, { dev });
        break;
      }

      case "Remove a package": {
        const packages = await askPackage();
        await removePackage(packages);
        break;
      }

      case "List installed packages":
        await listPackages();
        break;

      case "Check outdated packages":
        await runNpm(["outdated"], {
          allowExitCodes: [1]
        });
        break;

      case "Check security vulnerabilities":
        await runNpm(["audit"], {
          allowExitCodes: [1]
        });
        break;

      case "Explain NPM concepts": {
        const { topic } = await inquirer.prompt([
          {
            type: "select",
            name: "topic",
            message: "Choose a topic:",
            choices: listTopics()
          }
        ]);

        explainConcept(topic);
        break;
      }

      case "Learn NPM interactively":
        await startQuiz();
        break;

      case "Open the visual dashboard":
        await startDashboard();
        break;

      case "Exit":
        running = false;
        console.log(chalk.green("\nHappy coding!"));
        break;
    }
  }
}
