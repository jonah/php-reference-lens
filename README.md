# PHP Reference Lens

A lightweight VS Code extension that displays inline reference counts above PHP functions, classes, interfaces, and traits — no premium license required.

![VS Code](https://img.shields.io/badge/VS%20Code-1.75%2B-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## What it does

Adds a code lens showing **"N references"** above every PHP symbol definition. Clicking the count opens the references panel.

Works with any PHP language server (Intelephense free, PHP Intellisense, etc.) — it uses VS Code's built-in reference provider API.

## Supported symbols

- Functions and methods (public, private, protected, static, abstract, final)
- Classes (abstract, final)
- Interfaces
- Traits

## Install

### From source

```bash
git clone https://github.com/jonahbaker/php-reference-lens.git
ln -s "$(pwd)/php-reference-lens" ~/.vscode/extensions/php-reference-lens
```

Then reload VS Code (`Cmd+Shift+P` > "Developer: Reload Window").

### Manual

Copy the folder to `~/.vscode/extensions/php-reference-lens` and reload VS Code.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `phpReferenceLens.enabled` | `true` | Enable/disable reference counts |

## How it works

The extension registers a CodeLens provider for PHP files. For each function/class/interface/trait definition, it calls VS Code's `vscode.executeReferenceProvider` command — which delegates to whatever PHP language server you have installed — and displays the count. Results are cached per document version.

## Requirements

- VS Code 1.75+
- A PHP language server extension (e.g. Intelephense free, PHP IntelliSense)

## License

MIT
