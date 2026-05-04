const vscode = require('vscode');

const FUNCTION_PATTERN = /^\s*(?:(?:public|protected|private|static|abstract|final)\s+)*function\s+(\w+)\s*\(/gm;
const CLASS_PATTERN = /^\s*(?:(?:abstract|final)\s+)?class\s+(\w+)/gm;
const INTERFACE_PATTERN = /^\s*interface\s+(\w+)/gm;
const TRAIT_PATTERN = /^\s*trait\s+(\w+)/gm;

class PHPReferenceLensProvider {
    constructor() {
        this._onDidChange = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChange.event;
        this._cache = new Map();
    }

    refresh() {
        this._cache.clear();
        this._onDidChange.fire();
    }

    provideCodeLenses(document) {
        const config = vscode.workspace.getConfiguration('phpReferenceLens');
        if (!config.get('enabled', true)) {
            return [];
        }

        const text = document.getText();
        const lenses = [];

        const patterns = [FUNCTION_PATTERN, CLASS_PATTERN, INTERFACE_PATTERN, TRAIT_PATTERN];
        for (const pattern of patterns) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const line = document.positionAt(match.index).line;
                const range = new vscode.Range(line, 0, line, 0);
                lenses.push(new vscode.CodeLens(range, undefined));
            }
        }

        return lenses;
    }

    async resolveCodeLens(lens, token) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return lens;

        const document = editor.document;
        const line = document.lineAt(lens.range.start.line);
        const text = line.text;

        let nameMatch = text.match(/function\s+(\w+)/) ||
                         text.match(/class\s+(\w+)/) ||
                         text.match(/interface\s+(\w+)/) ||
                         text.match(/trait\s+(\w+)/);

        if (!nameMatch) {
            lens.command = { title: '', command: '' };
            return lens;
        }

        const name = nameMatch[1];
        if (name === '__construct' || name === '__destruct') {
            lens.command = { title: '', command: '' };
            return lens;
        }

        const nameIndex = text.indexOf(name, text.indexOf(nameMatch[0]));
        const position = new vscode.Position(lens.range.start.line, nameIndex);

        const cacheKey = `${document.uri.toString()}:${lens.range.start.line}:${document.version}`;
        if (this._cache.has(cacheKey)) {
            lens.command = this._cache.get(cacheKey);
            return lens;
        }

        try {
            const refs = await vscode.commands.executeCommand(
                'vscode.executeReferenceProvider',
                document.uri,
                position
            );

            if (token.isCancellationRequested) return lens;

            const count = refs ? refs.filter(r =>
                !(r.uri.toString() === document.uri.toString() &&
                  r.range.start.line === lens.range.start.line)
            ).length : 0;

            const title = count === 1 ? '1 reference' : `${count} references`;
            lens.command = {
                title,
                command: 'editor.action.findReferences',
                arguments: [document.uri, position]
            };

            this._cache.set(cacheKey, lens.command);
        } catch {
            lens.command = { title: '', command: '' };
        }

        return lens;
    }
}

function activate(context) {
    const provider = new PHPReferenceLensProvider();

    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            { language: 'php', scheme: 'file' },
            provider
        )
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(() => provider.refresh())
    );

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(() => provider.refresh())
    );
}

function deactivate() {}

module.exports = { activate, deactivate };
