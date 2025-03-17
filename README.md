# Copy Files Content

A simple and flexible VS Code extension that copies the content of files in your workspace to the clipboard based on file extension patterns and exclusions.

## Features

- Copy the content of files matching specific patterns (e.g., `*.ts, *.js`).
- Exclude specific folders or files (e.g., `node_modules, dist`).
- Optimized for performance and memory efficiency.
- Easy-to-use interface with interactive prompts.

## Installation

1. **Via VS Code Marketplace** (after publishing):
   - Search for "Copy Files Content" in the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X` on macOS).
   - Click "Install".

2. **Manual Installation**:
   - Download the `.vsix` file from the [releases page](#) (replace with your link after publishing).
   - In VS Code, go to the Extensions view, click the `...` menu, and select "Install from VSIX".
   - Select the downloaded `.vsix` file.

## Usage

1. Open a folder in VS Code.
2. Open the Command Palette:
   - `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS).
3. Type and select **"Copy Files Content"**.
4. Follow the prompts:
   - **Include Patterns**: Enter file patterns to include (e.g., `*.ts, *.js`).
   - **Exclude Patterns**: Enter folders/files to exclude (e.g., `node_modules, dist`).
5. The content of all matching files will be copied to your clipboard.

### Example
- **Include**: `*.ts, *.js`
- **Exclude**: `node_modules, dist`
- **Result**: Copies the content of all `.ts` and `.js` files in the workspace, excluding those in `node_modules` or `dist`.

## Requirements

- VS Code version 1.60.0 or higher.
- A workspace folder must be open to use the extension.

## Extension Settings

This extension currently has no configurable settings. Future updates may add options for default patterns or output formatting.

## Known Issues

- Large workspaces with many files may take longer to process. Future versions will include progress indicators.
- Report any issues on the [GitHub Issues page](#) (replace with your repo link).

## Contributing

1. Fork the repository.
2. Clone your fork: `git clone https://github.com/your-username/copy-files-content.git`.
3. Install dependencies: `npm install`.
4. Make changes and test with `F5` in VS Code.
5. Submit a pull request.

## License

This extension is licensed under the [MIT License](LICENSE).

## Acknowledgements

- Built with TypeScript and the VS Code Extension API.
- Thanks to the open-source community for inspiration and tools.