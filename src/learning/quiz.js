import inquirer from "inquirer";
import chalk from "chalk";

export const questions = [
  {
    question: "Which command installs Express?",
    choices: [
      "node install express",
      "npm install express",
      "git install express"
    ],
    answer: "npm install express",
    explanation: "NPM installs packages using npm install."
  },
  {
    question: "Where are dependencies stored?",
    choices: [
      "package.json only",
      "node_modules",
      "index.html"
    ],
    answer: "node_modules",
    explanation:
      "Installed package files are stored in node_modules."
  },
  {
    question: "Which flag installs a dev dependency?",
    choices: ["--dev", "--save-dev", "--production"],
    answer: "--save-dev",
    explanation:
      "The --save-dev flag adds a package to devDependencies."
  }
];

export async function startQuiz() {
  let score = 0;

  console.log(
    chalk.cyan("\nWelcome to NPM Learning Quiz!\n")
  );

  for (const q of questions) {
    const response = await inquirer.prompt([
      {
        type: "select",
        name: "answer",
        message: q.question,
        choices: q.choices
      }
    ]);

    if (response.answer === q.answer) {
      score++;
      console.log(chalk.green("✓ Correct!"));
    } else {
      console.log(chalk.red("✗ Incorrect!"));
      console.log("Correct answer:", q.answer);
    }

    console.log(chalk.gray(q.explanation));
    console.log("");
  }

  console.log(
    chalk.green(`Your score: ${score}/${questions.length}`)
  );
}
