
# Text Grab

A simple and flexible VS Code extension that copies the content of files in your workspace to the clipboard based on file extension patterns and exclusions.

## Features

- Copy the content of files matching specific patterns (e.g., `*.ts, *.js`).
- Recursively process specified folders (e.g., `src, lib`).
- Exclude specific folders or files (e.g., `node_modules, dist`).
- Configuration via JSON files (global or project-specific).
- Status bar button for quick access.
- Optimized for performance and memory efficiency.

## Installation

1. **Via VS Code Marketplace**:

   - Search for "Text Grab" in the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X` on macOS).
   - Click "Install".

2. **Manual Installation**:

   - In VS Code, go to the Extensions view, click the `...` menu, and select "Install from VSIX".
   - Select the downloaded `.vsix` file.

## Usage

### Via Command Palette

1. Open a folder in VS Code.
2. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
3. Type and select **"Text Grab"**.

### Via Status Bar

1. Open a folder in VS Code.
2. Look at the bottom status bar for a button labeled "Copy Files" with a clipboard icon.
3. Click the button to copy file contents.

### Configuration

- **Global Config**: Create `<user>/.text-grab.config.json` in your home directory.
- **Project Config**: Create `text-grab.config.json` in your workspace root.
- Example config:
  ```json
  {
    "extensions": ["*.ts", "*.js"],
    "includeFolders": ["src", "lib"],
    "exclude": ["node_modules", "dist"]
  }
  ```
