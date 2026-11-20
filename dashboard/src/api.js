async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.error || `Request failed with status ${response.status}.`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  health: () => request("/health"),
  project: () => request("/project"),
  setProject: (projectPath) => request("/project", { method: "POST", body: { path: projectPath } }),
  packages: () => request("/packages"),
  outdated: () => request("/outdated"),
  audit: () => request("/audit"),
  activity: () => request("/activity"),
  doctor: () => request("/doctor"),
  learn: () => request("/learn"),
  playgroundCommands: () => request("/playground"),
  install: (packages, dev) => request("/install", { method: "POST", body: { packages, dev } }),
  uninstall: (packages) => request("/uninstall", { method: "POST", body: { packages } }),
  playground: (command, packageName) =>
    request("/playground", { method: "POST", body: { command, package: packageName } })
};
