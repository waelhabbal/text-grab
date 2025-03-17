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
  const commandId = "textgrab.copyFilesContent";
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = commandId;
  statusBarItem.text = "$(clippy) Copy Files";
  statusBarItem.tooltip = "Copy file contents to clipboard based on config";
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);

  const disposable = vscode.commands.registerCommand(commandId, async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage("No workspace folder open.");
      return;
    }

    const rootPath = workspaceFolder.uri.fsPath;
    const config = await loadConfig(rootPath);

    const extensions = await getConfigValue(
      config.extensions,
      "File patterns",
      "*.ts, *.js, ..."
    );
    const includeFolders = await getConfigValue(
      config.includeFolders,
      "Folders",
      "src , app, ..."
    );
    const exclude = await getConfigValue(
      config.exclude,
      "excluded folders/files",
      "node_modules, dist"
    );

    if (!extensions?.length || !includeFolders?.length) {
      vscode.window.showErrorMessage("Required configuration missing.");
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
      vscode.window.showErrorMessage(`Error: ${(error as Error).message}`);
    }
  });

  context.subscriptions.push(disposable);
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

  try {
    if (await fs.pathExists(globalConfigPath)) {
      config = { ...config, ...(await fs.readJson(globalConfigPath)) };
    }
    if (await fs.pathExists(projectConfigPath)) {
      config = { ...config, ...(await fs.readJson(projectConfigPath)) };
    }
  } catch (error) {
    vscode.window.showWarningMessage(
      `Invalid config file: ${(error as Error).message}`
    );
  }

  return config;
}

async function getConfigValue(
  configValue: string[],
  prompt: string,
  placeHolder: string
): Promise<string[] | undefined> {
  if (configValue.length > 0) {
    return configValue;
  }
  const input = await vscode.window.showInputBox({ prompt, placeHolder });
  return input ? input.split(",").map((s) => s.trim()) : undefined;
}

async function processFiles(
  rootPath: string,
  extensions: string[],
  includeFolders: string[],
  exclude: string[]
): Promise<string> {
  const results: string[] = [];
  const queue = includeFolders.map((folder) => path.join(rootPath, folder));

  while (queue.length) {
    const dir = queue.shift()!;
    if (!(await fs.pathExists(dir)) || exclude.some((e) => dir.includes(e))) {
      continue;
    }

    try {
      const dirents = await fs.readdir(dir, { withFileTypes: true });
      for (const dirent of dirents) {
        const fullPath = path.join(dir, dirent.name);

        if (exclude.some((pattern) => fullPath.includes(pattern))) {
          continue;
        }

        if (dirent.isDirectory()) {
          queue.push(fullPath);
        } else if (dirent.isFile() && matchesPattern(dirent.name, extensions)) {
          try {
            const content = await fs.readFile(fullPath, "utf8");
            results.push(`// File: ${fullPath}\n${content}\n`);
          } catch (error) {
            console.warn(
              `Failed to read ${fullPath}: ${(error as Error).message}`
            );
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to process ${dir}: ${(error as Error).message}`);
    }
  }

  return results.join("\n");
}

function matchesPattern(fileName: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$", "i");
    return regex.test(fileName);
  });
}

export function deactivate() {}
