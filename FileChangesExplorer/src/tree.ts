import * as vscode from "vscode";
import { FileChange } from "./utils";

export class FilesChangesProvider
  implements vscode.TreeDataProvider<TreeItemInfo>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    TreeItemInfo | undefined | void
  > = new vscode.EventEmitter<TreeItemInfo | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItemInfo | undefined | void> =
    this._onDidChangeTreeData.event;

  constructor(private fileChangesInfo: FileChange[]) {
    this.fileChangesInfo = fileChangesInfo;
  }

  getTreeItem(element: TreeItemInfo): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItemInfo): Thenable<TreeItemInfo[]> {
    if (this.fileChangesInfo.length < 1) {
      vscode.window.showInformationMessage("No new changes found");
      return Promise.resolve([]);
    }

    if (!element) {
      return Promise.resolve(
        this.fileChangesInfo.map(
          (fileInfo) =>
            new TreeItemInfo(
              fileInfo.filePath,
              vscode.TreeItemCollapsibleState.Collapsed
            )
        )
      );
    } else {
      const currentFileInfo = this.fileChangesInfo.find(
        (fileInfo) => fileInfo.filePath === element.label
      );
      const currentFileChangesInfo = currentFileInfo?.changes ?? [];

      if (currentFileChangesInfo.length) {
        return Promise.resolve(
          currentFileChangesInfo.map(
            ({ startLine, endLine }) =>
              new TreeItemInfo(
                `Line ${startLine}-${endLine}`,
                vscode.TreeItemCollapsibleState.None,
                {
                  command: "filechanges.openFileAtLine",
                  title: "",
                  arguments: [currentFileInfo?.filePath, startLine],
                }
              )
          )
        );
      } else {
        return Promise.resolve([]);
      }
    }
  }

  refresh(fileChangesInfo: FileChange[]): void {
    this.fileChangesInfo = fileChangesInfo;
    this._onDidChangeTreeData.fire();
  }
}
class TreeItemInfo extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
  }
}
