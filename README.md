# npm-buddy

**NPM made simple. Learning made easy.**

A beginner-friendly CLI that combines package management with an
interactive learning assistant.

> Published on npm as **`npm-pal`**. The package installs the
> `npm-buddy` command.

## Requirements

- Node.js 22.12 or newer
- npm

## Installation

```bash
npm install -g npm-pal
```

## Quick start

Run it inside any Node.js project:

```bash
npm-buddy
```

No arguments opens the interactive menu. You can also use commands
directly.

## Commands

| Command | What it does |
| --- | --- |
| `npm-buddy` | Open the interactive menu |
| `npm-buddy install <packages...>` | Install packages |
| `npm-buddy install nodemon --dev` | Install as a dev dependency |
| `npm-buddy remove <packages...>` | Remove packages |
| `npm-buddy list` | List installed packages |
| `npm-buddy outdated` | Check for outdated packages |
| `npm-buddy audit` | Check for security vulnerabilities |
| `npm-buddy explain <topic>` | Explain an NPM concept |
| `npm-buddy learn` | Start the NPM learning quiz |
| `npm-buddy doctor` | Check Node.js and NPM versions |
| `npm-buddy dashboard` | Open the visual dashboard in your browser |
| `npm-buddy --help` | Show available commands |
| `npm-buddy --version` | Show the version |

### Visual dashboard

`npm-buddy dashboard` starts a local dashboard for the project in your
current folder and opens it at <http://127.0.0.1:4174>.

- Overview with live activity, dependency health and security summary
- Install and remove packages with validated names
- Security audit, outdated packages and project doctor
- NPM concepts and an interactive quiz
- A command playground limited to read-only npm commands

The dashboard binds to localhost only, never asks for npm credentials, and
stops when you press `Ctrl+C` in the terminal.

### Learning topics

```bash
npm-buddy explain dependencies
npm-buddy explain devdependencies
npm-buddy explain packagejson
npm-buddy explain packagejsonlock
npm-buddy explain node_modules
```

## Demo project

`demo/` is a sample Express app with a health-check page, a production
dependency (axios) and a dev dependency (nodemon), made for trying npm-pal
safely.

```bash
cd demo
npm install
npm start              # http://localhost:3000
npm-buddy dashboard    # browse the same project in the browser
```

See [demo/README.md](demo/README.md) for a guided tour of the dashboard and
the matching CLI commands. The demo is not part of the published tarball.

## Features

- Simple package management
- Interactive terminal menu
- Visual browser dashboard
- NPM concept explanations
- Beginner learning quiz
- Beginner-friendly error messages

## Local development

```bash
npm install
node src/index.js --help
npm test
```

To use the command from anywhere while developing:

```bash
npm link
```

## License

MIT
