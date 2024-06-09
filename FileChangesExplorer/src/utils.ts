import * as vscode from "vscode";
import * as fs from "fs";
import * as os from "os";
import { spawn } from "child_process";
import path from "path";

export interface FileInfo {
  workspaceRoot: string;
  relativePath: string;
  absolutePath: string;
  fileName: string;
  isStaged: boolean;
  hasStagedVersion?: boolean;
}

export interface FileChange {
  fileInfo: FileInfo;
  changes: { startLine: number; endLine: number }[];
}

const runGitDiff = (args: string[], workspaceRoot: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const gitProcess = spawn("git", args, { cwd: workspaceRoot });

    let stdout = "";
    let stderr = "";

    gitProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    gitProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    gitProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr));
      } else {
        resolve(stdout);
      }
    });
  });
};

const sortFileNames = (fileA: FileChange, fileB: FileChange) => {
  const fileAName = fileA.fileInfo.fileName.toLowerCase();
  const fileBName = fileB.fileInfo.fileName.toLowerCase();

  if (fileAName < fileBName) {
    return -1;
  }
  if (fileAName > fileBName) {
    return 1;
  }
  return 0;
};

export async function getChangedFilesDetails(): Promise<FileChange[]> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage("No workspace is currently open.");
    return [];
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;

  try {
    const [unstagedDiff, stagedDiff] = await Promise.all([
      runGitDiff(["diff", "--unified=0"], workspaceRoot),
      runGitDiff(["diff", "--unified=0", "--staged"], workspaceRoot),
    ]);

    const stagedChanges = parseGitDiff(stagedDiff, workspaceRoot, true).sort(
      sortFileNames
    );
    const unstagedChanges = parseGitDiff(unstagedDiff, workspaceRoot, false)
      .sort(sortFileNames)
      .map((unstagedInfo) => {
        const hasStagedVersion = Boolean(
          stagedChanges.find(
            (stagedInfo) =>
              stagedInfo.fileInfo.absolutePath ===
              unstagedInfo.fileInfo.absolutePath
          )
        );
        return {
          ...unstagedInfo,
          fileInfo: { ...unstagedInfo.fileInfo, hasStagedVersion },
        };
      });

    return [...stagedChanges, ...unstagedChanges];
  } catch (e) {
    const errorMessage =
      e && typeof e === "object" && "message" in e
        ? ` : due to an error: ${e?.message?.toString()}`
        : "";
    vscode.window.showErrorMessage(`Failed to get changes${errorMessage}`);
    return [];
  }
}

function parseGitDiff(
  diffOutput: string,
  workspaceRoot: string,
  isStaged: boolean
): FileChange[] {
  const fileChanges: FileChange[] = [];
  const fileDiffs = String(diffOutput)
    .split(/^diff --git a\/.* b\/.*$/gm)
    .slice(1);

  for (const fileDiff of fileDiffs) {
    const lines = String(fileDiff).split("\n");
    const filePathLine = lines.find((line) => line.startsWith("--- a/"));
    if (!filePathLine) {
      continue;
    }

    const relativeFilePath = filePathLine.replace("--- a/", "");
    const absoluteFilePath = path.join(workspaceRoot, relativeFilePath);
    const fileName = path.basename(absoluteFilePath);
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

    const fileInfo = {
      workspaceRoot,
      relativePath: relativeFilePath,
      absolutePath: absoluteFilePath,
      fileName,
      isStaged,
    };

    fileChanges.push({ fileInfo, changes });
  }

  return fileChanges;
}

export async function openFileAtLineInDiffEditor(
  fileInfo: FileInfo,
  line: number
) {
  try {
    if (!fileInfo.workspaceRoot) {
      throw new Error("No workspace folder is open.");
    }

    // Get the previous version of the file using Git
    const previousVersion = await getPreviousFileVersion(fileInfo);
    if (!previousVersion) {
      throw new Error("Could not retrieve the previous version of the file.");
    }
    let latestFilePath = fileInfo.absolutePath;
    if (fileInfo.isStaged) {
      const stagedVersion = await getPreviousFileVersion(fileInfo, true);
      if (!stagedVersion) {
        throw new Error("Could not retrieve the staged version of the file.");
      }
      // Save the staged version to a temporary file
      latestFilePath = path.join(os.tmpdir(), `staged_${fileInfo.fileName}`);
      fs.writeFileSync(latestFilePath, stagedVersion);
      // fs.chmodSync(latestFilePath, 0o444); // Read-only
    }

    // Save the previous version to a temporary file
    const tempFilePath = path.join(os.tmpdir(), `prev_${fileInfo.fileName}`);
    fs.writeFileSync(tempFilePath, previousVersion);
    // fs.chmodSync(tempFilePath, 0o444); // Read-only

    const prevFileUri = vscode.Uri.file(tempFilePath);
    const latestFileUri = vscode.Uri.file(latestFilePath);

    await vscode.commands.executeCommand(
      "vscode.diff",
      prevFileUri,
      latestFileUri,
      `Diff View: ${fileInfo.fileName}`
    );

    // Get the active text editor
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new Error("No active editor found.");
    }

    // Set the cursor position
    const position = new vscode.Position(line - 1, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(new vscode.Range(position, position));
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(
        `File ${fileInfo.fileName} cannot be opened due to an error: ${error.message}.`
      );
    } else {
      vscode.window.showErrorMessage(
        `File ${fileInfo.fileName} cannot be opened.`
      );
    }
  }
}

async function getPreviousFileVersion(
  file: FileInfo,
  getStagedVersion?: boolean
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const filePath = `./${file.relativePath}`.replace(/\\/g, "/");
    const commandArg =
      file.hasStagedVersion || getStagedVersion
        ? `:${filePath}`
        : `HEAD~1:${filePath}`;
    const gitProcess = spawn("git", ["show", commandArg], {
      cwd: file.workspaceRoot,
    });

    let stdout = "";
    let stderr = "";

    gitProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    gitProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    gitProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Git command error: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}
