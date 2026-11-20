# How to use npm-pal in your own project

This guide shows how to apply **`npm-buddy`** to everyday project work.
It assumes the CLI is installed (see [QUICKSTART.md](QUICKSTART.md) for
first-time setup):

```bash
npm install -g npm-pal
npm-buddy --version    # prints 1.1.0
```

## The one rule: npm-buddy manages the folder you are in

Every command acts on the Node.js project in your current working
directory. `cd` into the project first:

```bash
cd path/to/your-project
npm-buddy list
```

If there is no `package.json` there, create a project first
(`npm init -y`) or `cd` somewhere else. The dashboard can be pointed at
another folder from its **Settings** page.

---

## Scenario 1: Start a new project

```bash
mkdir my-api && cd my-api
npm init -y

npm-buddy install express
npm-buddy install nodemon --dev
npm-buddy list
```

`npm-buddy install` runs a real `npm install`, so `package.json`,
`package-lock.json`, and `node_modules` stay in sync. Use `--dev` for
tooling that is not needed in production (test runners, linters,
`nodemon`).

**How to decide prod vs dev:** if your code `import`s it while the app
runs, it is a dependency. If it only helps you build, test, or develop,
it is a devDependency.

## Scenario 2: You just cloned a project you have never seen

Run these in order to understand the project before changing anything:

```bash
npm install          # install what package.json declares
npm-buddy doctor     # confirm Node.js and npm versions match expectations
npm-buddy list       # see production vs dev dependencies
npm-buddy outdated   # see what is behind current releases
npm-buddy dashboard  # browse it visually at http://127.0.0.1:4174
```

The dashboard **Overview** immediately shows dependency counts, packages
declared but missing from `node_modules`, missing lockfile, and a
security summary, so you know the project's health before you touch it.

## Scenario 3: Add dependencies without breaking the project

```bash
npm-buddy install zod
npm-buddy install express zod dotenv          # several at once
npm-buddy install express@^5.3.0              # pin a version range
npm-buddy install express@5.3.0               # pin an exact version
npm-buddy install vitest --dev                # tooling only
```

- Package names are validated before npm runs, so typos and shell
  tricks fail fast with a readable message.
- If npm itself fails, its real error is printed above the friendly
  hint. Fix the name or version and run the command again.
- After install, `npm-buddy list` confirms the package is registered
  under the right section (dependencies vs devDependencies).

## Scenario 4: Remove dependencies you no longer use

```bash
npm-buddy remove lodash
npm-buddy remove lodash moment            # several at once
```

Before removing, check that nothing imports the package:

```bash
grep -r "from \"lodash\"" src/
```

If the app still imports a removed package, it fails at startup or at
the first import. Run your tests after removing.

## Scenario 5: Keep packages current without surprises

```bash
npm-buddy outdated
```

The table shows each package's current version, the version your
declared range allows (`wanted`), and the newest release (`latest`).

- **wanted vs latest:** `wanted` fits the range in `package.json`;
  `latest` may be a breaking major release.
- npm-buddy deliberately does not bulk-upgrade. Upgrade one package at
  a time and run your tests:

```bash
npm-buddy install <package>@latest
npm test
```

Repeat with the next package. Small, tested steps beat one giant
upgrade.

## Scenario 6: Security check before you deploy or share

```bash
npm-buddy audit
```

This runs `npm audit` against your lockfile and reports vulnerability
severities and affected packages without crashing on findings.

- Commit `package-lock.json` first; audit is only as accurate as the
  lockfile.
- For the visual version, open `npm-buddy dashboard` and use the
  **Security** page: severity cards plus a per-package breakdown.
- Remediation (upgrading the affected package) is done with
  `npm-buddy install <package>@<safe-version>` or `npm audit fix`
  from npm itself.

A good habit: run `npm-buddy audit` before every release.

## Scenario 7: Inspect a package before installing it

Open the dashboard and use **Playground**:

```text
> npm view zod
```

The playground is limited to read-only commands (`list`, `outdated`,
`audit`, `view <package>`, `--version`), so you can look up a package's
version, description, and homepage without changing your project.

## Scenario 8: Learn npm while you do real work

```bash
npm-buddy explain dependencies
npm-buddy explain devdependencies
npm-buddy explain packagejson
npm-buddy explain packagejsonlock
npm-buddy explain node_modules
npm-buddy learn
```

`explain` also accepts file names, so `npm-buddy explain package.json`
and `npm-buddy explain package-lock.json` work the way you would
naturally type them.

`npm-buddy learn` is a short quiz; every answer comes with a one-line
explanation, so mistakes teach you something. The dashboard has the
same content under **Concepts** and **Quiz**.

## Scenario 9: Use the dashboard as your project cockpit

```bash
npm-buddy dashboard
```

It starts a local server for the project in the current folder and
opens <http://127.0.0.1:4174>.

- **Overview**: dependency health, security count, live activity, and a
  quick command runner.
- **Packages**: install and remove with validated names and a
  confirmation step.
- **Security / Outdated / Doctor**: the same checks as the CLI, with
  detail panels.
- **Concepts / Quiz**: the learning material with a friendlier layout.
- **Settings**: switch the dashboard to another project folder.

The server binds to `127.0.0.1` only, checks Host and Origin headers,
and never asks for npm credentials. Press `Ctrl+C` in the terminal to
stop it. If it reports the port is already in use, the dashboard is
already running in another terminal.

## Scenario 10: Teach or demo with the sample app

The repository includes `demo/`, a small Express + Axios app with a
health-check page:

```bash
cd demo
npm install
npm start              # http://localhost:3000
npm-buddy dashboard    # inspect the same project visually
```

The page's **Check health** button calls `/api/health` and shows app
name, Node version, uptime, and npm registry reachability. The demo is
not part of the published tarball.

---

## Command reference by goal

| Goal | Command |
| --- | --- |
| See what the project has | `npm-buddy list` |
| Add a production package | `npm-buddy install <pkg>` |
| Add a dev-only tool | `npm-buddy install <pkg> --dev` |
| Pin or upgrade a version | `npm-buddy install <pkg>@<range-or-version>` |
| Remove packages | `npm-buddy remove <pkg...>` |
| Check for newer releases | `npm-buddy outdated` |
| Check vulnerabilities | `npm-buddy audit` |
| Verify Node/npm versions | `npm-buddy doctor` |
| Understand a concept | `npm-buddy explain <topic>` |
| Take the learning quiz | `npm-buddy learn` |
| Browse everything visually | `npm-buddy dashboard` |
| Guided menu | `npm-buddy` |

Use it without a global install, per project:

```bash
npm install --save-dev npm-pal
npx npm-buddy list
```

## Limits and safety notes

- Requires Node.js 22.12 or newer and npm on `PATH`.
- Commands are fixed npm operations; there is no arbitrary shell
  execution.
- Package names are validated before anything runs.
- The dashboard is local-only (`127.0.0.1`), enforces Host and Origin
  checks, and rejects invalid input.
- No npm credentials are requested or stored at any point.

## FAQ

**Does npm-buddy change my project without me knowing?**
No. It only runs the install/remove you type or click, and every
mutation is confirmed in the dashboard.

**Can I manage two projects at once?**
Run `npm-buddy dashboard` once per project (the second start reports
the port as busy) or switch folders in **Settings**.

**Does audit work without `node_modules`?**
Yes, if `package-lock.json` exists. `outdated` and `install` need to
resolve the registry, so they need network access.

**I don't want a global install.**
Install it as a devDependency and run it with `npx npm-buddy`.

**How do I uninstall?**
`npm uninstall -g npm-pal`. Your projects and their `package.json`
files are untouched.
