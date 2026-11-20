import { spawn } from "node:child_process";
import path from "node:path";
import { existsSync } from "node:fs";
import chalk from "chalk";

const HOST = "127.0.0.1";
const PORT = 4174;

function openBrowser(url) {
  const [command, args] =
    process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", url]]
        : ["xdg-open", [url]];

  const child = spawn(command, args, { stdio: "ignore", detached: true });
  child.on("error", () => {});
  child.unref();
}

export async function startDashboard() {
  if (!process.env.NPM_PAL_PROJECT && !existsSync(path.join(process.cwd(), "package.json"))) {
    console.error(chalk.yellow("\n  No package.json in this folder."));
    console.error(chalk.dim("  Run `npm-buddy dashboard` inside a Node.js project.\n"));
    process.exitCode = 1;
    return;
  }

  const [{ createApp }, { getState }] = await Promise.all([
    import("../../dashboard/server/app.js"),
    import("../../dashboard/server/operations.js")
  ]);

  const url = `http://${HOST}:${PORT}`;
  const server = createApp().listen(PORT, HOST, () => {
    console.log(chalk.cyan("\n  npm-pal dashboard"));
    console.log(chalk.dim("  Project: "), getState().projectPath);
    console.log(chalk.dim("  Local:   "), url);
    console.log(chalk.dim("\n  Press Ctrl+C to stop.\n"));

    if (!process.env.NPM_PAL_NO_OPEN) {
      openBrowser(url);
    }
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.log(chalk.yellow(`\n  Dashboard is already running at ${url}\n`));
      if (!process.env.NPM_PAL_NO_OPEN) {
        openBrowser(url);
      }
      return;
    }

    console.error(chalk.red(`Could not start the dashboard: ${error.message}`));
    process.exitCode = 1;
  });

  const stop = () => {
    console.log(chalk.dim("\n  Dashboard stopped."));
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
