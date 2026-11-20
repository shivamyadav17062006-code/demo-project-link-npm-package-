# npm-pal demo project

A tiny Express app to try **npm-pal / npm-buddy** against a real Node.js
project. Nothing here is published; it exists so you can click around the
dashboard and run CLI commands safely.

The app has two dependencies (`express`, `chalk`) and one dev dependency
(`nodemon`), which is enough to see production vs development packages,
outdated checks, and the dependency mix in the dashboard.

## 1. Install the CLI

```bash
npm install -g npm-pal
npm-buddy --version    # 1.1.0 or newer
```

## 2. Install the demo

From this folder (`demo/`):

```bash
npm install
```

## 3. Open the dashboard

```bash
npm-buddy dashboard
```

The browser opens at <http://127.0.0.1:4174>, already pointed at this folder.
Press `Ctrl+C` in the terminal to stop it.

## Things to try

| Where | Action |
| --- | --- |
| Overview | Watch the activity chart after each operation |
| Packages | Install `zod` (production), then install `vitest` with the dev toggle |
| Packages | Remove `vitest` — confirm the two-step action |
| Security audit | See npm audit results for the installed tree |
| Outdated packages | Compare current, wanted and latest versions |
| Command playground | Run `npm view express` and read the registry JSON |
| NPM concepts | Read "Dependencies" and "DevDependencies" |
| Interactive quiz | Score the three-question quiz |
| Activity logs | Inspect the exact npm command behind each action |
| Project doctor | Check Node, npm, lockfile and node_modules |

## CLI equivalents

Everything the dashboard does is also a command:

```bash
npm-buddy list
npm-buddy install zod
npm-buddy install vitest --dev
npm-buddy remove vitest
npm-buddy outdated
npm-buddy audit
npm-buddy doctor
npm-buddy explain dependencies
npm-buddy learn
```

## Run the app itself

```bash
npm start        # http://127.0.0.1:3000
npm run dev      # nodemon, restarts on change
npm test         # node:test against the HTTP routes
```

## Clean up

```bash
npm-buddy remove zod vitest
```

`node_modules/` and `package-lock.json` are yours to keep or delete; the
repository ignores `node_modules/`.
