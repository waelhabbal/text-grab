# Text Grab

A flexible VS Code extension that copies the content of files within a specified directory to the clipboard based on file extension patterns and exclusions. It supports configuration via JSON files (global or project-specific) and offers template-based configurations for common project types.

## Features

- Copy the content of files matching specific patterns (e.g., `*.ts, *.js`).
- **Specify a single root search path** for recursive file processing.
- Exclude specific folders or files (e.g., `node_modules, dist`).
- **Template-based configurations** for quick setup with common project types (e.g., ASP.NET Core, Next.js, React).
- Configuration via JSON files (global or project-specific).
- Status bar button for quick access to the copy command.
- **Initialize configuration command** to create a `text-grab.config.json` with default templates.
- **Set template command** to easily switch between predefined configurations.
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
3. Type and select one of the following commands:
   - **"Text Grab: Copy Files Content"**: Copies file contents to the clipboard based on the current configuration.
   - **"Text Grab: Initialize Configuration"**: Creates a `text-grab.config.json` file in your workspace root, allowing you to choose a default template.
   - **"Text Grab: Set Template"**: Allows you to change the active template in your existing `text-grab.config.json` file.

### Via Status Bar

1. Open a folder in VS Code.
2. Look at the bottom status bar for a button labeled "Copy Files" with a clipboard icon.
3. Click the button to copy file contents based on the current configuration.

### Configuration

Text Grab can be configured using a JSON file named `text-grab.config.json`. This file can be placed either:

- **Globally**: In your home directory as `<user>/.text-grab.config.json`. Global configuration will be used as defaults for all workspaces.
- **Per Project**: In the root of your workspace folder. Project-specific configuration will override global settings.

#### Configuration Options

```json
{
  "extensions": ["*.ts", "*.js"],
  "searchPath": "src",
  "exclude": ["node_modules", "dist"],
  "template": "nextjs" // Optional: Name of a predefined template to use
}
```
