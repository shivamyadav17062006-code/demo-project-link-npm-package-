import chalk from "chalk";

import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 3000;

createApp().listen(port, "127.0.0.1", () => {
  console.log(chalk.green(`Demo server running at ${chalk.bold(`http://127.0.0.1:${port}`)}`));
  console.log(chalk.dim("Press Ctrl+C to stop."));
});
