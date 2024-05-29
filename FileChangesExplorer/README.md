# FileChangesExplorer Extension

## Overview

The **FileChangesExplorer** extension helps you track changes in your workspace files by displaying line numbers of modified files in a tree view. It integrates with Git to show the changes in your files and provides a convenient way to navigate to those changes.

## Features

- **View Modified Files**: See a list of all modified files in your workspace along with the specific line numbers that have changed.
- **Navigate to Changes**: Click on any line number to directly navigate to the corresponding line in the file.
- **Refresh Functionality**: Easily refresh the list to see the latest changes.

## Requirements

- **Visual Studio Code**: Version 1.70.0 or higher.
- **Git**: Must be installed and available in your system's PATH.

## Installation

1. Open Visual Studio Code.
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window or by pressing `Ctrl+Shift+X`.
3. Search for `FileChangesExplorer`.
4. Click `Install` on the `FileChangesExplorer` extension.

## Usage

### Activating the Extension

To activate the extension, open the "File Changes Explorer" view from the Activity Bar.

### Viewing Modified Files

1. Open the "File Changes Explorer" view from the Activity Bar.
2. The extension will automatically list all the modified files and their line numbers.

### Navigating to Changes

Click on any line number under a modified file to open that file and navigate to the specific line where the change occurred.

### Refreshing the List

Click on the `Refresh` button in the "File Changes Explorer" view title to update the list of modified files and their line numbers.

## Commands

- **Refresh**: Refreshes the list of modified files.
  - Command ID: `filechangesexplorer.refresh`
  - Available from the "File Changes Explorer" view title.

## Extension Settings

This extension does not contribute any settings currently.

## Known Issues

- The extension requires a Git repository to be initialized in the workspace. If no Git repository is found, an error message will be displayed.

## Release Notes

### 0.0.1

- Initial release of FileChangesExplorer.

  - Display modified files and their line numbers.
  - Navigate to changes by clicking on line numbers.
  - Refresh functionality to update the list.

### 0.1.0

- Decreased vscode version compatibility to v1.70.0.
- Fixed filechangesexplorer refresh button appearing on all the title bars of vscode.
- Added auto refresh whenever changes in any file is saved.

## FAQ

### How do I activate the extension?

The extension is activated when you open the "File Changes Explorer" view from the Activity Bar.

### Why can't I see any changes?

Ensure that your workspace is a Git repository. The extension requires a Git repository to function. If no Git repository is found, an error message will be displayed.

### How do I navigate to a specific change?

Click on any line number under a modified file in the "File Changes Explorer" view to open the file and navigate to the specific line where the change occurred.

### How do I refresh the list of changes?

Click on the `Refresh` button in the "File Changes Explorer" view title to update the list of modified files and their line numbers.
