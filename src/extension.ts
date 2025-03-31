import * as vscode from "vscode";
import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";

interface Config {
  extensions: string[];
  searchPath: string;
  exclude: string[];
  template?: string;
}

interface Templates {
  [templateName: string]: {
    extensions: string[];
    exclude: string[];
  };
}

const defaultTemplates: Templates = {
  "asp core": {
    extensions: ["*.cs", "*.cshtml", "*.js", "*.css"],
    exclude: ["bin", "obj", "node_modules", "wwwroot/lib", "wwwroot/dist"],
  },
  nextjs: {
    extensions: ["*.js", "*.jsx", "*.ts", "*.tsx", "*.module.css"],
    exclude: [".next", "node_modules", "out", ".git"],
  },
  react: {
    extensions: ["*.js", "*.jsx", "*.ts", "*.tsx", "*.module.css", "*.css"],
    exclude: ["node_modules", "build", ".git"],
  },
  "react router": {
    extensions: ["*.js", "*.jsx", "*.ts", "*.tsx"],
    exclude: ["node_modules", "build", ".git", "test", "cypress"],
  },
  // Add more templates as needed
};

export function activate(context: vscode.ExtensionContext) {
  const copyCommandId = "textgrab.copyFilesContent";
  const initCommandId = "textgrab.init";
  const setTemplateCommandId = "textgrab.setTemplate";

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = copyCommandId;
  statusBarItem.text = "$(clippy) Copy Files";
  statusBarItem.tooltip = "Copy file contents to clipboard based on config";
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);

  const copyDisposable = vscode.commands.registerCommand(
    copyCommandId,
    async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }

      const rootPath = workspaceFolder.uri.fsPath;
      const config = await loadConfig(rootPath);

      if (!config.searchPath) {
        vscode.window.showWarningMessage(
          "No 'searchPath' configured in text-grab.config.json. Please update your configuration."
        );
        return;
      }

      try {
        const content = await processFiles(
          rootPath,
          config.extensions,
          config.searchPath,
          config.exclude
        );
        if (content.trim() === "") {
          vscode.window.showInformationMessage(
            "No matching file content found."
          );
        } else {
          await vscode.env.clipboard.writeText(content);
          vscode.window.showInformationMessage(
            "File contents copied to clipboard!"
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(`Error: ${(error as Error).message}`);
      }
    }
  );

  context.subscriptions.push(copyDisposable);

  const initDisposable = vscode.commands.registerCommand(
    initCommandId,
    async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }

      const rootPath = workspaceFolder.uri.fsPath;
      const configPath = path.join(rootPath, "text-grab.config.json");

      const templateNames = Object.keys(defaultTemplates);
      const selectedTemplate = await vscode.window.showQuickPick(
        ["None", ...templateNames],
        {
          placeHolder: "Select a default template to initialize with",
        }
      );

      if (selectedTemplate !== undefined) {
        let initialConfig: any = {
          extensions: [],
          searchPath: ".",
          exclude: [],
        };

        if (selectedTemplate !== "None" && defaultTemplates[selectedTemplate]) {
          initialConfig = {
            extensions: defaultTemplates[selectedTemplate].extensions,
            searchPath: ".",
            exclude: defaultTemplates[selectedTemplate].exclude,
            template: selectedTemplate,
          };
        }

        try {
          await fs.outputJson(configPath, initialConfig, { spaces: 4 });
          vscode.window.showInformationMessage(
            `Text Grab configuration file created at ${configPath}`
          );
        } catch (error) {
          vscode.window.showErrorMessage(
            `Failed to create configuration file: ${(error as Error).message}`
          );
        }
      }
    }
  );

  context.subscriptions.push(initDisposable);

  const setTemplateDisposable = vscode.commands.registerCommand(
    setTemplateCommandId,
    async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }

      const rootPath = workspaceFolder.uri.fsPath;
      const configPath = path.join(rootPath, "text-grab.config.json");

      try {
        if (!(await fs.pathExists(configPath))) {
          vscode.window.showErrorMessage(
            "No text-grab.config.json found in the workspace. Run 'Text Grab: Initialize Configuration' first."
          );
          return;
        }

        const config = await fs.readJson(configPath);
        const templateNames = Object.keys(defaultTemplates);
        const currentTemplate = config.template || "None";

        const selectedTemplate = await vscode.window.showQuickPick(
          ["None", ...templateNames],
          {
            placeHolder: "Select a template to apply",
          }
        );

        if (selectedTemplate !== undefined) {
          config.template =
            selectedTemplate === "None" ? undefined : selectedTemplate;
          await fs.writeJson(configPath, config, { spaces: 4 });
          vscode.window.showInformationMessage(
            `Text Grab template set to: ${selectedTemplate}`
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to update configuration file: ${(error as Error).message}`
        );
      }
    }
  );

  context.subscriptions.push(setTemplateDisposable);
}

async function loadConfig(rootPath: string): Promise<Config> {
  const defaultConfig: Config = {
    extensions: [],
    searchPath: ".",
    exclude: [],
  };
  const globalConfigPath = path.join(os.homedir(), ".text-grab.config.json");
  const projectConfigPath = path.join(rootPath, "text-grab.config.json");

  let config: Config = { ...defaultConfig };

  try {
    if (await fs.pathExists(globalConfigPath)) {
      config = { ...config, ...(await fs.readJson(globalConfigPath)) };
    }
    if (await fs.pathExists(projectConfigPath)) {
      config = { ...config, ...(await fs.readJson(projectConfigPath)) };
    }

    // Apply template if specified
    if (config.template && defaultTemplates[config.template]) {
      const template = defaultTemplates[config.template];
      config.extensions = template.extensions;
      config.exclude = [...new Set([...config.exclude, ...template.exclude])];
    }
  } catch (error) {
    vscode.window.showWarningMessage(
      `Invalid config file: ${(error as Error).message}`
    );
  }

  return config;
}

async function processFiles(
  rootPath: string,
  extensions: string[],
  searchPath: string,
  exclude: string[]
): Promise<string> {
  const results: string[] = [];
  const queue = [
    path.isAbsolute(searchPath) ? searchPath : path.join(rootPath, searchPath),
  ];

  while (queue.length) {
    const currentPath = queue.shift()!;

    if (
      !(await fs.pathExists(currentPath)) ||
      exclude.some((e) => currentPath.includes(e))
    ) {
      continue;
    }

    try {
      const dirents = await fs.readdir(currentPath, { withFileTypes: true });
      for (const dirent of dirents) {
        const fullPath = path.join(currentPath, dirent.name);

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
      console.warn(
        `Failed to process ${currentPath}: ${(error as Error).message}`
      );
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
