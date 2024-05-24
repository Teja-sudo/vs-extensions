// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { FilesChangesProvider } from "./tree";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const workspaceRoot =
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : "";
  const filesChangesProvider = new FilesChangesProvider(workspaceRoot);
  vscode.window.registerTreeDataProvider("changesView", filesChangesProvider);
  vscode.commands.registerCommand(
    "my-changes-view.openFileAtLine",
    (file: string, line: number) => {
      openFileAtLine(file, line);
    }
  );

  vscode.commands.registerCommand("my-changes-view.refresh", () => {
    // filesChangesProvider.refresh();
  });

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "filechangesexplorerbysanik.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage(
        "Hello World from FileChangesExplorer!"
      );
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
