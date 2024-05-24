import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface FileChange {
  filePath: string;
  changes: { startLine: number; endLine: number }[];
}

export async function getChangedFilesDetails(): Promise<FileChange[]> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage("No workspace is currently open.");

    return [];
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  try {
    const { stdout } = await execAsync("git diff --unified=0", {
      cwd: workspaceRoot,
    });
    return parseGitDiff(stdout);
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(`Failed to get changes: ${error.message}`);
    } else {
      vscode.window.showErrorMessage("Failed to get changes: Unknown error");
    }

    return [];
  }
}

function parseGitDiff(diffOutput: string): FileChange[] {
  const fileChanges: FileChange[] = [];
  const fileDiffs = diffOutput.split(/^diff --git a\/.* b\/.*$/gm).slice(1);

  for (const fileDiff of fileDiffs) {
    const lines = fileDiff.split("\n");
    const filePathLine = lines.find((line) => line.startsWith("--- a/"));
    if (!filePathLine) {
      continue;
    }

    const filePath = filePathLine.replace("--- a/", "");
    const changes: { startLine: number; endLine: number }[] = [];

    const hunkHeaders = lines.filter((line) => line.startsWith("@@ "));
    for (const hunkHeader of hunkHeaders) {
      const match = /@@ -\d+(,\d+)? \+(\d+)(,(\d+))? @@/.exec(hunkHeader);
      if (match) {
        const startLine = parseInt(match[2], 10);
        const lineCount = match[4] ? parseInt(match[4], 10) : 1;
        const endLine = startLine + lineCount - 1;
        changes.push({ startLine, endLine });
      }
    }

    fileChanges.push({ filePath, changes });
  }

  return fileChanges;
}
