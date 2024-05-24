// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { FilesChangesProvider } from "./tree";
import { getChangedFilesDetails } from "./utils";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("Hi there");
  let fileChangesInfo = await getChangedFilesDetails();
  fileChangesInfo = [
    {
      filePath: "server/server.js",
      changes: [
        {
          startLine: 1,
          endLine: 1,
        },
      ],
    },
  ];
  console.log(fileChangesInfo);
  vscode.window.showInformationMessage(JSON.stringify(fileChangesInfo));
  const filesChangesProvider = new FilesChangesProvider(fileChangesInfo);

  vscode.window.registerTreeDataProvider(
    "filesChangesView",
    filesChangesProvider
  );

  vscode.commands.registerCommand(
    "filechanges.openFileAtLine",
    (file: string, line: number) => {
      openFileAtLine(file, line);
    }
  );

  let disposable = vscode.commands.registerCommand(
    "filechanges.refresh",
    async () => {
      const fileChangesInfo = await getChangedFilesDetails();
      filesChangesProvider.refresh(fileChangesInfo);
    }
  );

  context.subscriptions.push(disposable);
}

async function openFileAtLine(file: string, line: number) {
  const document = await vscode.workspace.openTextDocument(file);
  const editor = await vscode.window.showTextDocument(document);
  const position = new vscode.Position(line - 1, 0);
  editor.selection = new vscode.Selection(position, position);
  editor.revealRange(new vscode.Range(position, position));
}

// This method is called when your extension is deactivated
export function deactivate() {}
