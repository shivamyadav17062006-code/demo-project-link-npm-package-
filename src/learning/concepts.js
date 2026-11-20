import chalk from "chalk";

const concepts = {
  dependencies: {
    title: "Dependencies",
    meaning: "Packages required by your application to run.",
    example: "express, mongoose, jsonwebtoken",
    command: "npm install express"
  },

  devdependencies: {
    title: "DevDependencies",
    meaning:
      "Packages needed during development, testing or building.",
    example: "nodemon, eslint, typescript",
    command: "npm install nodemon --save-dev"
  },

  packagejson: {
    title: "package.json",
    meaning:
      "The main configuration file of a Node.js project.",
    example:
      "Contains project name, scripts and dependencies.",
    command: "npm init -y"
  },

  packagejsonlock: {
    title: "package-lock.json",
    meaning:
      "Locks the exact dependency versions installed in your project.",
    example: "Helps reproduce the same dependency tree.",
    command: "npm install"
  },

  node_modules: {
    title: "node_modules",
    meaning:
      "Directory containing installed packages and their dependencies.",
    example: "express, chalk, commander",
    command: "npm install"
  }
};

export function getConcept(topic) {
  return concepts[topic.toLowerCase()];
}

export function listTopics() {
  return Object.keys(concepts);
}

export function explainConcept(topic) {
  const concept = getConcept(topic);

  if (!concept) {
    console.log(chalk.red("\nTopic not found."));
    console.log(
      "Available topics:",
      listTopics().join(", ")
    );
    return;
  }

  console.log(chalk.cyan(`\n${concept.title}`));

  console.log(
    chalk.green("\nMeaning:"),
    concept.meaning
  );

  console.log(
    chalk.green("\nExamples:"),
    concept.example
  );

  console.log(
    chalk.green("\nTry this command:"),
    concept.command
  );
}
