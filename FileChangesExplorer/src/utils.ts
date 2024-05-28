import * as vscode from "vscode";
import { spawn } from "child_process";

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
  return new Promise((resolve, reject) => {
    const gitDiff = spawn("git", ["diff", "--unified=0"], {
      cwd: workspaceRoot,
    });

    let stdout = "";
    let stderr = "";

    gitDiff.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    gitDiff.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    gitDiff.on("close", (code) => {
      if (code !== 0) {
        vscode.window.showErrorMessage(`Failed to get changes: ${stderr}`);
        reject(new Error(`git diff process exited with code ${code}`));
      } else {
        resolve(parseGitDiff(stdout, workspaceRoot));
      }
    });
  });
}

function parseGitDiff(diffOutput: string, workspaceRoot: string): FileChange[] {
  const fileChanges: FileChange[] = [];
  const fileDiffs = diffOutput.split(/^diff --git a\/.* b\/.*$/gm).slice(1);

  for (const fileDiff of fileDiffs) {
    const lines = fileDiff.split("\n");
    const filePathLine = lines.find((line) => line.startsWith("--- a/"));
    if (!filePathLine) {
      continue;
    }

    const relativeFilePath = filePathLine.replace("--- a/", "");
    const absoluteFilePath = `${workspaceRoot}/${relativeFilePath}`;
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

    fileChanges.push({ filePath: absoluteFilePath, changes });
  }

  return fileChanges;
}
