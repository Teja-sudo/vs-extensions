// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { FilesChangesProvider } from "./tree";
import { getChangedFilesDetails } from "./utils";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const fileChangesInfo = await getChangedFilesDetails();
  const filesChangesProvider = new FilesChangesProvider(fileChangesInfo);

  vscode.window.registerTreeDataProvider(
    "filechangesexplorer",
    filesChangesProvider
  );

  vscode.commands.registerCommand(
    "filechangesexplorer.openFileAtLine",
    (file: string, line: number) => {
      openFileAtLine(file, line);
    }
  );

  let disposable = vscode.commands.registerCommand(
    "filechangesexplorer.refresh",
    async () => {
      const fileChangesInfo = await getChangedFilesDetails();
      filesChangesProvider.refresh(fileChangesInfo);
    }
  );

  context.subscriptions.push(disposable);
}

async function openFileAtLine(file: string, line: number) {
  try {
    const document = await vscode.workspace.openTextDocument(file);
    const editor = await vscode.window.showTextDocument(document);
    const position = new vscode.Position(line - 1, 0);

    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position));
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(
        `File ${file} cannot be opened due to an error ${error.message}.`
      );
    } else {
      vscode.window.showErrorMessage(`File ${file} cannot be opened.`);
    }
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
