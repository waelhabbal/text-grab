# Copy Files Content

A simple and flexible VS Code extension that copies the content of files in your workspace to the clipboard based on file extension patterns and exclusions.

## Features

- Copy the content of files matching specific patterns (e.g., `*.ts, *.js`).
- Recursively process specified folders (e.g., `src, lib`).
- Exclude specific folders or files (e.g., `node_modules, dist`).
- Configuration via JSON files (global or project-specific).
- Optimized for performance and memory efficiency.

## Installation

1. **Via VS Code Marketplace** (after publishing):

   - Search for "Copy Files Content" in the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X` on macOS).
   - Click "Install".

2. **Manual Installation**:
   - Download the `.vsix` file from the [releases page](https://github.com/waelhabbal/copy-files-content/releases).
   - In VS Code, go to the Extensions view, click the `...` menu, and select "Install from VSIX".
   - Select the downloaded `.vsix` file.

## Usage

1. Open a folder in VS Code.
2. (Optional) Configure the extension:
   - **Global Config**: Create `~/.file-content-combiner.json` in your home directory.
   - **Project Config**: Create `file-content-combiner.json` in your workspace root.
   - Example config:
     ```json
     {
       "extensions": ["*.ts", "*.js"],
       "includeFolders": ["src", "lib"],
       "exclude": ["node_modules", "dist"]
     }
     ```
