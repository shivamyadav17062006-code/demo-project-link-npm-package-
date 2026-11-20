import { runNpm } from "../utils/runner.js";

export async function listPackages() {
  await runNpm(["list", "--depth=0"]);
}
