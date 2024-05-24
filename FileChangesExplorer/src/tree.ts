import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class FilesChangesProvider
  implements vscode.TreeDataProvider<Dependency>
{
  constructor(private workspaceRoot: string) {}

  getTreeItem(element: Dependency): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Dependency): Thenable<Dependency[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage("No dependency in empty workspace");
      return Promise.resolve([]);
    }

    if (element) {
      return Promise.resolve(
        this.getDepsInPackageJson(
          path.join(
            this.workspaceRoot,
            "node_modules",
            element.label,
            "package.json"
          )
        )
      );
    } else {
      const packageJsonPath = path.join(this.workspaceRoot, "package.json");
      if (this.pathExists(packageJsonPath)) {
        return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
      } else {
        vscode.window.showInformationMessage("Workspace has no package.json");
        return Promise.resolve([]);
      }
    }
  }

  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
    if (this.pathExists(packageJsonPath)) {
      const toDep = (moduleName: string, version: string): Dependency => {
        if (
          this.pathExists(
            path.join(this.workspaceRoot, "node_modules", moduleName)
          )
        ) {
          return new Dependency(
            moduleName,
            version,
            vscode.TreeItemCollapsibleState.Collapsed
          );
        } else {
          return new Dependency(
            moduleName,
            version,
            vscode.TreeItemCollapsibleState.None
          );
        }
      };

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      const deps = packageJson.dependencies
        ? Object.keys(packageJson.dependencies).map((dep) =>
            toDep(dep, packageJson.dependencies[dep])
          )
        : [];
      const devDeps = packageJson.devDependencies
        ? Object.keys(packageJson.devDependencies).map((dep) =>
            toDep(dep, packageJson.devDependencies[dep])
          )
        : [];
      return deps.concat(devDeps);
    } else {
      return [];
    }
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
  }
}

class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
  }

  iconPath = {
    light: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "light",
      "dependency.svg"
    ),
    dark: path.join(
      __filename,
      "..",
      "..",
      "resources",
      "dark",
      "dependency.svg"
    ),
  };
}

`warning: in the working copy of 'FileChangesExplorer/src/extension.ts', LF will be replaced by CRLF the next time Git touches it
diff --git a/FileChangesExplorer/src/extension.ts b/FileChangesExplorer/src/extension.ts
index 497b17f..81b1d6b 100644
--- a/FileChangesExplorer/src/extension.ts
+++ b/FileChangesExplorer/src/extension.ts
@@ -3 +3 @@
-import * as vscode from 'vscode';
+import * as vscode from "vscode";
@@ -7,0 +8,5 @@ export function activate(context: vscode.ExtensionContext) {
+  // Use the console to output diagnostic information (console.log) and errors (console.error)
+  // This line of code will only be executed once when your extension is activated
+  console.log(
+    'Congratulations, your extension "filechangesexplorerbysanik" is now active!'
+  );
@@ -9,3 +14,13 @@ export function activate(context: vscode.ExtensionContext) {
-       // Use the console to output diagnostic information (console.log) and errors (console.error)
-       // This line of code will only be executed once when your extension is activated
-       console.log('Congratulations, your extension "filechangesexplorerbysanik" is now active!');
+  // The command has been defined in the package.json file
+  // Now provide the implementation of the command with registerCommand
+  // The commandId parameter must match the command field in package.json
+  let disposable = vscode.commands.registerCommand(
+    "filechangesexplorerbysanik.helloWorld",
+    () => {
+      // The code you place here will be executed every time your command is executed
+      // Display a message box to the user
+      vscode.window.showInformationMessage(
+        "Hello World from FileChangesExplorer!"
+      );
+    }
+  );
@@ -13,8 +28,2 @@ export function activate(context: vscode.ExtensionContext) {
-       // The command has been defined in the package.json file
-       // Now provide the implementation of the command with registerCommand
-       // The commandId parameter must match the command field in package.json
-       let disposable = vscode.commands.registerCommand('filechangesexplorerbysanik.helloWorld', () => {
-               // The code you place here will be executed every time your command is executed
-               // Display a message box to the user
-               vscode.window.showInformationMessage('Hello World from FileChangesExplorer!');
-       });
+  context.subscriptions.push(disposable);
+}
@@ -22 +31,6 @@ export function activate(context: vscode.ExtensionContext) {
-       context.subscriptions.push(disposable);
+async function openFileAtLine(file: string, line: number) {
+  const document = await vscode.workspace.openTextDocument(file);
+  const editor = await vscode.window.showTextDocument(document);
+  const position = new vscode.Position(line - 1, 0);
+  editor.selection = new vscode.Selection(position, position);
+  editor.revealRange(new vscode.Range(position, position));
diff --git a/FileChangesExplorer/src/tree.ts b/FileChangesExplorer/src/tree.ts
index 98bdc3d..0e107be 100644
--- a/FileChangesExplorer/src/tree.ts
+++ b/FileChangesExplorer/src/tree.ts
@@ -5 +5 @@ import * as path from "path";
-export class NodeDependenciesProvider
+export class FilesChangesProvider`;

/*
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface FileChange {
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
    vscode.window.showErrorMessage(`Failed to get changes: ${error.message}`);
    return [];
  }
}

function parseGitDiff(diffOutput: string): FileChange[] {
  const fileChanges: FileChange[] = [];
  const fileDiffs = diffOutput.split(/^diff --git a\/.* b\/.*$/gm).slice(1);

  for (const fileDiff of fileDiffs) {
    const lines = fileDiff.split("\n");
    const filePathLine = lines.find((line) => line.startsWith("--- a/"));
    if (!filePathLine) continue;

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
*/

/*
import * as vscode from 'vscode';

interface Change {
    file: string;
    lines: number[];
}

class ChangeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);
    }
}

export class ChangesProvider implements vscode.TreeDataProvider<ChangeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ChangeItem | undefined | void> = new vscode.EventEmitter<ChangeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<ChangeItem | undefined | void> = this._onDidChangeTreeData.event;

    private changes: Change[];

    constructor() {
        this.changes = this.getMockChanges();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ChangeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: ChangeItem): Thenable<ChangeItem[]> {
        if (!element) {
            return Promise.resolve(this.changes.map(change => 
                new ChangeItem(change.file, vscode.TreeItemCollapsibleState.Collapsed)
            ));
        } else {
            const change = this.changes.find(c => c.file === element.label);
            if (change) {
                return Promise.resolve(change.lines.map(line => 
                    new ChangeItem(`Line ${line}`, vscode.TreeItemCollapsibleState.None, {
                        command: 'my-changes-view.openFileAtLine',
                        title: '',
                        arguments: [change.file, line]
                    })
                ));
            } else {
                return Promise.resolve([]);
            }
        }
    }

    private getMockChanges(): Change[] {
        return [
            { file: 'src/file1.ts', lines: [10, 20, 30] },
            { file: 'src/file2.ts', lines: [15, 25] }
        ];
    }
}

*/
