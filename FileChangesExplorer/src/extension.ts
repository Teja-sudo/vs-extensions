// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { FilesChangesProvider } from "./tree";
import {
  FileInfo,
  getChangedFilesDetails,
  openFileAtLineInDiffEditor,
} from "./utils";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const fileChangesInfo = await getChangedFilesDetails();
  const filesChangesProvider = new FilesChangesProvider(fileChangesInfo);
  let saveFileTimerId: string | number | NodeJS.Timeout | undefined;

  vscode.window.registerTreeDataProvider(
    "filechangesexplorer",
    filesChangesProvider
  );

  // Create an input box for searching by filenames
  // const searchInput = vscode.window.createInputBox();
  // searchInput.placeholder = "Search filenames (comma-separated)";
  // searchInput.onDidChangeValue((text) => {
  //   // Update the filter term whenever the input value changes
  //   filesChangesProvider.searchText = text;
  // });

  // // Create checkboxes for filtering by staged and unstaged changes
  // const stagedCheckbox = vscode.window.createQuickPick();
  // stagedCheckbox.items = [{ label: "Staged", picked: true }];
  // stagedCheckbox.onDidChangeSelection((items) => {
  //   const isStagedSelected = Boolean(items[0].picked);

  //   if (!filesChangesProvider.isUnStaged && !isStagedSelected) {
  //     unstagedCheckbox.items[0].picked = true;
  //     stagedCheckbox.items[0].picked = true;
  //   } else {
  //     filesChangesProvider.isStaged = isStagedSelected;
  //   }
  // });

  // const unstagedCheckbox = vscode.window.createQuickPick();
  // unstagedCheckbox.items = [{ label: "Unstaged", picked: true }];
  // unstagedCheckbox.onDidChangeSelection((items) => {
  //   const isUnstagedSelected = Boolean(items[0].picked);

  //   if (!filesChangesProvider.isStaged && !isUnstagedSelected) {
  //     unstagedCheckbox.items[0].picked = true;
  //     stagedCheckbox.items[0].picked = true;
  //   } else {
  //     filesChangesProvider.isUnstaged = isUnstagedSelected;
  //   }
  // });

  // // Show checkboxes and search input in the UI
  // searchInput.show();
  // stagedCheckbox.show();
  // unstagedCheckbox.show();

  const openFileCommand = vscode.commands.registerCommand(
    "filechangesexplorer.openFileAtLine",
    (fileInfo: FileInfo, line: number) => {
      openFileAtLine(fileInfo, line);
    }
  );

  const onSaveCleaner = vscode.workspace.onDidSaveTextDocument(() => {
    clearTimeout(saveFileTimerId);
    saveFileTimerId = setTimeout(async () => {
      const fileChangesInfo = await getChangedFilesDetails();
      filesChangesProvider.refresh(fileChangesInfo);
    }, 0.2);
  });

  const refreshCommand = vscode.commands.registerCommand(
    "filechangesexplorer.refresh",
    async () => {
      const fileChangesInfo = await getChangedFilesDetails();
      filesChangesProvider.refresh(fileChangesInfo);
    }
  );

  context.subscriptions.push(
    openFileCommand,
    refreshCommand,
    onSaveCleaner
    // searchInput,
    // stagedCheckbox,
    // unstagedCheckbox
  );
}

async function openFileAtLine(fileInfo: FileInfo, line: number) {
  try {
    await openFileAtLineInDiffEditor(fileInfo, line);
  } catch (e) {
    try {
      const errorMessage =
        e && typeof e === "object" && "message" in e
          ? ` due to an error: ${e?.message?.toString()}`
          : "";
      vscode.window.showErrorMessage(
        `Filed to show changes for ${fileInfo.relativePath}${errorMessage}.`
      );
      const document = await vscode.workspace.openTextDocument(
        fileInfo.absolutePath
      );
      const editor = await vscode.window.showTextDocument(document);
      const position = new vscode.Position(line - 1, 0);

      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position));
    } catch (error) {
      if (error && typeof error === "object" && "message" in error) {
        vscode.window.showErrorMessage(
          `File ${
            fileInfo.absolutePath
          } cannot be opened due to an error: ${error?.message?.toString()}.`
        );
      } else {
        vscode.window.showErrorMessage(
          `File ${fileInfo.absolutePath} cannot be opened.`
        );
      }
    }
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  /* TODO  */
}
