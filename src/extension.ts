import * as vscode from "vscode";
import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";

interface Config {
  extensions: string[];
  includeFolders: string[];
  exclude: string[];
}

export function activate(context: vscode.ExtensionContext) {
  // Register the command
  const commandId = "copy-files-content.copyFilesContent";
  let disposable = vscode.commands.registerCommand(commandId, async () => {
    if (!vscode.workspace.workspaceFolders) {
      vscode.window.showErrorMessage("No workspace folder open.");
      return;
    }

    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const config = await loadConfig(rootPath);

    const extensions =
      config.extensions.length > 0
        ? config.extensions
        : await promptForInput(
            "Enter file patterns (e.g., *.ts, *.js)",
            "*.ts, *.js",
            true
          );
    const includeFolders =
      config.includeFolders.length > 0
        ? config.includeFolders
        : await promptForInput(
            "Enter folders to include (e.g., src, lib)",
            "src",
            true
          );
    const exclude =
      config.exclude.length > 0
        ? config.exclude
        : await promptForInput(
            "Enter folders/files to exclude (e.g., node_modules, dist)",
            "node_modules, dist",
            true
          );

    if (!extensions || !includeFolders) {
      return;
    }

    try {
      const content = await processFiles(
        rootPath,
        extensions,
        includeFolders,
        exclude || []
      );
      await vscode.env.clipboard.writeText(content);
      vscode.window.showInformationMessage(
        "File contents copied to clipboard!"
      );
    } catch (error) {
      const err = error as Error;
      vscode.window.showErrorMessage(`Error: ${err.message}`);
    }
  });

  // Create a status bar item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = commandId; // Link to the existing command
  statusBarItem.text = "$(clippy) Copy Files"; // Icon and text
  statusBarItem.tooltip = "Copy file contents to clipboard based on config";
  statusBarItem.show(); // Display the button

  // Add disposables to context
  context.subscriptions.push(disposable, statusBarItem);
}

async function loadConfig(rootPath: string): Promise<Config> {
  const defaultConfig: Config = {
    extensions: [],
    includeFolders: [],
    exclude: [],
  };
  const globalConfigPath = path.join(os.homedir(), ".text-grab.config.json");
  const projectConfigPath = path.join(rootPath, "text-grab.config.json");

  let config = defaultConfig;

  if (await fs.pathExists(globalConfigPath)) {
    const globalConfig = await fs.readJson(globalConfigPath);
    config = { ...config, ...globalConfig };
  }

  if (await fs.pathExists(projectConfigPath)) {
    const projectConfig = await fs.readJson(projectConfigPath);
    config = { ...config, ...projectConfig };
  }

  return config;
}

async function promptForInput(
  prompt: string,
  placeHolder: string,
  split: boolean = false
): Promise<string[] | undefined> {
  const input = await vscode.window.showInputBox({ prompt, placeHolder });
  if (!input) {
    return undefined;
  }
  return split ? input.split(",").map((s) => s.trim()) : [input];
}

async function processFiles(
  rootPath: string,
  extensions: string[],
  includeFolders: string[],
  exclude: string[]
): Promise<string> {
  const results: string[] = [];

  for (const folder of includeFolders) {
    const dir = path.join(rootPath, folder);
    if (!(await fs.pathExists(dir))) {
      continue;
    }

    const dirents = await fs.readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
      const fullPath = path.join(dir, dirent.name);

      if (exclude.some((pattern) => fullPath.includes(pattern))) {
        continue;
      }

      if (dirent.isDirectory()) {
        const subContent = await processFiles(
          rootPath,
          extensions,
          [path.relative(rootPath, fullPath)],
          exclude
        );
        if (subContent) {
          results.push(subContent);
        }
      } else if (dirent.isFile() && matchesPattern(dirent.name, extensions)) {
        const content = await fs.readFile(fullPath, "utf8");
        results.push(`// File: ${fullPath}\n${content}\n`);
      }
    }
  }

  return results.join("\n");
}

function matchesPattern(fileName: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return regex.test(fileName);
  });
}

export function deactivate() {}
