# npm-pal Quickstart

Get productive in about five minutes. This guide is for anyone using the
published package **`npm-pal`**, which installs the **`npm-buddy`** command.

You will need Node.js 22.12 or newer and npm. The CLI works inside any
Node.js project.

---

## 1. Check your tools

```bash
node --version    # should print v22.12.0 or newer
npm --version
```

If Node is older, upgrade it first (the CLI's dependencies require a modern
runtime).

## 2. Install the CLI once

```bash
npm install -g npm-pal
```

Verify the command is on your PATH:

```bash
npm-buddy --version    # prints 1.1.0
```

`EACCES` or `permission denied`? Never use `sudo` with npm. Configure a
user-level global folder instead:

```bash
npm config set prefix ~/.npm-global
export PATH="$HOME/.npm-global/bin:$PATH"
npm install -g npm-pal
```

Add the `export` line to your shell profile (`~/.zshrc` or `~/.bashrc`) so it
survives new terminals.

## 3. Open a project

The CLI manages dependencies for the project in your current folder.

```bash
cd my-node-app

# No project yet?
mkdir my-app && cd my-app && npm init -y
```

You should see a `package.json` in that folder.

## 4. First run

```bash
npm-buddy
```

That opens the interactive menu:

```
Install a package
Remove a package
List installed packages
Check outdated packages
Check security vulnerabilities
Explain NPM concepts
Learn NPM interactively
Open the visual dashboard
Exit
```

Pick an option with the arrow keys and press Enter. Everything you can do in
the menu also has a direct command.

## 5. Common tasks

| Goal | Command |
| --- | --- |
| Install a package | `npm-buddy install express` |
| Install several at once | `npm-buddy install express zod dotenv` |
| Pin a version range | `npm-buddy install express@^5.3.0` |
| Install a dev dependency | `npm-buddy install nodemon --dev` |
| Remove a package | `npm-buddy remove express` |
| List installed packages | `npm-buddy list` |
| Check for newer versions | `npm-buddy outdated` |
| Check for vulnerabilities | `npm-buddy audit` |
| Check environment | `npm-buddy doctor` |
| Open the dashboard | `npm-buddy dashboard` |
| Show all commands | `npm-buddy --help` |

Notes:

- `install` and `remove` accept multiple package names.
- `outdated` and `audit` report findings without crashing; a non-zero npm exit
  code with results is treated as success.
- Every action runs a real npm command, so `package.json`,
  `package-lock.json`, and `node_modules` stay in sync.

## 6. Learn npm while you work

Explain a concept in plain language:

```bash
npm-buddy explain dependencies
npm-buddy explain devdependencies
npm-buddy explain packagejson
npm-buddy explain packagejsonlock
npm-buddy explain node_modules
```

Take the short interactive quiz:

```bash
npm-buddy learn
```

Each answer includes a one-line explanation, so mistakes teach you something.

## 7. Optional: use the web dashboard

The dashboard is bundled with `npm-pal`. Run it inside the project you want
to manage:

```bash
npm-buddy dashboard
```

It starts a local server at <http://127.0.0.1:4174> and opens your browser.
Press `Ctrl+C` in the terminal to stop it.

What you get:

- Live project overview with activity, dependency health and security
- Install and remove packages with validated names
- Security audit, outdated packages and project doctor
- NPM concepts and an interactive quiz
- A playground for read-only npm commands (`list`, `outdated`, `audit`,
  `view`, `--version`)

The dashboard binds to localhost only and never asks for npm credentials.
Use **Settings** in the UI to point it at a different project folder.

Working in this repository? The source lives in `dashboard/`:

```bash
cd dashboard
npm install
npm run dev        # UI at http://localhost:5173, API on 127.0.0.1:4174
npm run build      # rebuild dashboard/dist, which ships in the package
```

## 8. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `npm-buddy: command not found` | Reinstall globally and check `npm bin -g` is on `PATH` |
| `EACCES` during install | Use a user-level prefix (see step 2), not `sudo` |
| `package.json` not found | `cd` into the project, or run `npm init -y` |
| Node engine warning/error | Upgrade Node.js to 22.12 or newer |
| Install fails | Read the npm error above the friendly message; fix the package name or version, then retry |
| Menu looks odd in a tiny terminal | Resize the window, or use direct commands instead |

## 9. Uninstall

```bash
npm uninstall -g npm-pal
```

Your projects keep their own `package.json` files; uninstalling the CLI does
not touch them.

---

Package: https://www.npmjs.com/package/npm-pal
License: MIT
