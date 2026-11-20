# npm-pal demo

A beginner-friendly npm companion CLI. This sample Node.js app exists so you
can try **npm-pal / npm-buddy** against a real project: install and remove
packages, audit them, and learn npm along the way.

## What this demo showcases

| Feature | Demo |
| --- | --- |
| Install packages | Install `express` and `axios` appear in the dashboard |
| Remove packages | Uninstall a dependency in two clicks |
| List packages | See declared vs installed versions |
| Outdated | Check for newer package versions |
| Audit | See dependency vulnerabilities |
| Explain | Learn npm concepts in plain language |
| Learn | Take the interactive beginner quiz |
| Doctor | Diagnose the npm / Node.js setup |
| Menu | Explore everything from one terminal menu |
| Dashboard | Browse it all in the browser at `127.0.0.1:4174` |

## Structure

```
npm-pal-demo/
├── server.js          Express app, /api/health via Axios
├── package.json
├── README.md
├── .gitignore
└── public/
    └── index.html     Sample website with a health-check button
```

## 1. Install dependencies

```bash
npm install
```

## 2. Install the published package

```bash
npm install -g npm-pal
npm-buddy --version    # 1.1.0 or newer
```

## 3. Start the demo application

```bash
npm start
```

Open <http://localhost:3000> and press **Check health**. The page calls
`/api/health`, which reports the Node.js version, uptime, and whether the npm
registry is reachable (that request uses Axios).

Use `npm run dev` to restart automatically with nodemon on file changes.

## 4. Demonstrate npm-pal

Open another terminal inside this folder:

```bash
npm-buddy                         # interactive menu
npm-buddy list                    # installed dependencies
npm-buddy outdated                # newer versions on the registry
npm-buddy audit                   # security report
npm-buddy explain package.json    # learn a concept
npm-buddy learn                   # beginner quiz
npm-buddy doctor                  # Node / npm environment
```

Try a real change while the dashboard is open:

```bash
npm-buddy install zod
npm-buddy install vitest --dev
npm-buddy remove vitest
```

## 5. Open the dashboard

```bash
npm-buddy dashboard
```

Your browser opens at <http://127.0.0.1:4174>, already pointed at this folder.
Press `Ctrl+C` in the terminal to stop the dashboard.

Things worth clicking:

- **Overview** — dependency mix, activity chart, project health
- **Packages** — install/remove with validated names, prod/dev filters
- **Security audit** — real `npm audit` findings
- **Outdated packages** — current vs wanted vs latest
- **Command playground** — run `npm view express`
- **NPM concepts** and **Interactive quiz**
- **Activity logs** — the exact npm command behind every operation
- **Project doctor** — environment checks

## Run both side by side

The sample app and the dashboard are separate processes that manage the
same folder:

| Terminal | Command | Runs at |
| --- | --- | --- |
| 1 (this folder) | `npm start` | <http://localhost:3000> |
| 2 (this folder) | `npm-buddy dashboard` | <http://127.0.0.1:4174> |

Keep the dashboard open and change something with the CLI in a third
terminal (`npm-buddy install zod`). The dashboard reflects the new
dependency on its next refresh, which makes the install/remove workflow
easy to demonstrate.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `npm-buddy: command not found` | Install globally: `npm install -g npm-pal`, then reopen the terminal |
| Dashboard port 4174 busy | Stop the other dashboard (`Ctrl+C`) or close the tab and retry |
| Health check shows registry unreachable | You are offline; the local checks still work |
| Page cannot find packages | Run `npm install` in this folder first |

The demo is not part of the published npm-pal package.
