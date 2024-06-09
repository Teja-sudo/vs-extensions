import * as vscode from "vscode";
import { FileChange, FileInfo } from "./utils";

export class FilesChangesProvider
  implements vscode.TreeDataProvider<TreeItemInfo>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    TreeItemInfo | undefined | void
  > = new vscode.EventEmitter<TreeItemInfo | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<TreeItemInfo | undefined | void> =
    this._onDidChangeTreeData.event;
  initialFileChangesInfo: FileChange[];
  searchInfo: { searchText: string; isStaged: boolean; isUnstaged: boolean };

  constructor(private fileChangesInfo: FileChange[]) {
    this.initialFileChangesInfo = fileChangesInfo;
    this.fileChangesInfo = fileChangesInfo;
    this.searchInfo = { searchText: "", isStaged: true, isUnstaged: true };
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
          (file) =>
            new TreeItemInfo(
              { fileInfo: file.fileInfo },
              vscode.TreeItemCollapsibleState.Collapsed
            )
        )
      );
    } else {
      const currentFileInfo = this.fileChangesInfo.find((file) => {
        const labelInfo = TreeItemInfo.labelFormatter({
          fileInfo: file.fileInfo,
        });
        return (
          (file.fileInfo.absolutePath ===
            element.labelInfo.fileInfo?.absolutePath &&
            file.fileInfo.isStaged === element.labelInfo.fileInfo.isStaged) ||
          labelInfo.label === element.label
        );
      });
      const currentFileChangesInfo = currentFileInfo?.changes ?? [];

      if (currentFileChangesInfo.length) {
        return Promise.resolve(
          currentFileChangesInfo.map(
            ({ startLine, endLine }) =>
              new TreeItemInfo(
                {
                  label:
                    endLine <= startLine
                      ? `Line ${startLine}`
                      : `Line ${startLine}-${endLine}`,
                },
                vscode.TreeItemCollapsibleState.None,
                {
                  command: "filechangesexplorer.openFileAtLine",
                  title: "",
                  arguments: [currentFileInfo?.fileInfo, startLine],
                }
              )
          )
        );
      } else {
        return Promise.resolve([]);
      }
    }
  }

  get isStaged(): boolean {
    return this.searchInfo.isStaged;
  }
  get isUnStaged(): boolean {
    return this.searchInfo.isUnstaged;
  }

  set searchText(searchText: string) {
    this.searchInfo.searchText = searchText;
  }

  set isStaged(isStaged: boolean) {
    this.searchInfo.isStaged = Boolean(isStaged);
  }

  set isUnstaged(isUnstaged: boolean) {
    this.searchInfo.isUnstaged = Boolean(isUnstaged);
  }

  refresh(fileChangesInfo: FileChange[]): void {
    this.initialFileChangesInfo = fileChangesInfo;
    this.fileChangesInfo = fileChangesInfo;
    // this.filterFileChanges();
    this._onDidChangeTreeData.fire();
  }

  filterFileChanges(): void {
    if (
      this.searchInfo.searchText ||
      !this.searchInfo.isStaged ||
      !this.searchInfo.isUnstaged
    ) {
      this.fileChangesInfo = this.initialFileChangesInfo; // If no query, reset filtered changes to all changes
      const searchTerms = this.searchText
        .split(",")
        .map((term) => term.trim().toLowerCase());
      let filteredChanges: FileChange[] = JSON.parse(
        JSON.stringify(this.fileChangesInfo)
      );
      if (searchTerms.length > 0) {
        filteredChanges = this.fileChangesInfo.filter((change) => {
          const fileName = change.fileInfo.fileName.toLowerCase();
          return searchTerms.some((term) => fileName.includes(term));
        });
      }

      if (!this.isStaged || !this.isUnStaged) {
        filteredChanges = filteredChanges.filter((file) => {
          return this.isUnStaged
            ? !file.fileInfo.isStaged
            : file.fileInfo.isStaged;
        });
      }

      this.fileChangesInfo = filteredChanges;
      this._onDidChangeTreeData.fire(); // Trigger tree data change event to update the view
    } else {
      this.fileChangesInfo = this.initialFileChangesInfo;
    }
  }
}
class TreeItemInfo extends vscode.TreeItem {
  constructor(
    public readonly labelInfo: { fileInfo?: FileInfo; label?: string },
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(TreeItemInfo.labelFormatter(labelInfo), collapsibleState);
  }

  static labelFormatter(labelInfo: {
    fileInfo?: FileInfo;
    label?: string;
  }): vscode.TreeItemLabel {
    const formattedLabelInfo: vscode.TreeItemLabel = {
      label: labelInfo.label ?? "",
    };
    const fileInfo = labelInfo.fileInfo;

    if (fileInfo) {
      const tag = fileInfo.isStaged ? "Staged" : "Unstaged";
      const extraSpace = tag === "Staged" ? "    " : "";
      const label = `${tag}  ${extraSpace}${fileInfo.fileName} - (${fileInfo.relativePath})`;
      const tagStartIndex = label.indexOf(tag);

      formattedLabelInfo.label = label;
      formattedLabelInfo.highlights = [
        [tagStartIndex, tagStartIndex + tag.length],
      ];
    }
    return formattedLabelInfo;
  }
}
