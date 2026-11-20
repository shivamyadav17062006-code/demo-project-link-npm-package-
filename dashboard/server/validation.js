import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";

export class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "ValidationError";
    this.status = status;
  }
}

const NPM_NAME = /^(?:@[a-z0-9][a-z0-9-_.]*\/)?[a-z0-9][a-z0-9-_.]*$/;
const VERSION = /^[a-zA-Z0-9^~.<>=|*+\-]+$/;
const MAX_NAME_LENGTH = 214;
const MAX_PACKAGES = 10;

export function parsePackageSpec(raw) {
  if (typeof raw !== "string") {
    throw new ValidationError("Package name must be a string.");
  }

  const spec = raw.trim();

  if (!spec) {
    throw new ValidationError("Package name cannot be empty.");
  }

  if (spec.startsWith("-")) {
    throw new ValidationError("Package names cannot start with '-'.");
  }

  if (/\s/.test(spec)) {
    throw new ValidationError("Package names cannot contain spaces.");
  }

  if (spec.length > MAX_NAME_LENGTH) {
    throw new ValidationError("Package name is too long.");
  }

  const atIndex = spec.lastIndexOf("@");
  const name = atIndex > 0 ? spec.slice(0, atIndex) : spec;
  const version = atIndex > 0 ? spec.slice(atIndex + 1) : "";

  if (!NPM_NAME.test(name)) {
    throw new ValidationError(`Invalid package name: ${name}`);
  }

  if (version && !VERSION.test(version)) {
    throw new ValidationError(`Invalid version specifier: ${version}`);
  }

  return version ? `${name}@${version}` : name;
}

export function parsePackageList(input) {
  if (!Array.isArray(input)) {
    throw new ValidationError("Expected an array of packages.");
  }

  if (input.length === 0) {
    throw new ValidationError("Provide at least one package.");
  }

  if (input.length > MAX_PACKAGES) {
    throw new ValidationError(`Install at most ${MAX_PACKAGES} packages at a time.`);
  }

  const seen = new Set();
  const packages = [];

  for (const item of input) {
    const spec = parsePackageSpec(item);
    const key = spec.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      packages.push(spec);
    }
  }

  return packages;
}

export async function resolveProjectPath(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new ValidationError("Project path cannot be empty.");
  }

  let target = raw.trim();

  if (target === "~") {
    target = os.homedir();
  } else if (target.startsWith("~/")) {
    target = path.join(os.homedir(), target.slice(2));
  }

  target = path.resolve(target);

  try {
    const stats = await fs.stat(target);
    if (!stats.isDirectory()) {
      throw new ValidationError(`Not a directory: ${target}`);
    }
    await fs.access(path.join(target, "package.json"));
    return target;
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    if (error.code === "ENOENT") {
      throw new ValidationError(
        `No package.json found at ${target}. Pick a Node.js project folder.`
      );
    }
    throw new ValidationError(`Cannot read project at ${target}: ${error.message}`);
  }
}

export function parseJson(text, fallback = null) {
  if (typeof text !== "string" || !text.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}
