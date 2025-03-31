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

const DEFAULT_TEMPLATES: Templates = {
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

const CONFIG_FILE_NAME = "text-grab.config.json";
const GLOBAL_CONFIG_PATH = path.join(os.homedir(), `.${CONFIG_FILE_NAME}`);

const CONFIG_SCHEMA_KEYS: (keyof Config)[] = [
  "extensions",
  "searchPath",
  "exclude",
  "template",
];

async function validateConfigSchema(configPath: string): Promise<boolean> {
  try {
    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath);
      return CONFIG_SCHEMA_KEYS.every((key) => config.hasOwnProperty(key));
    }
    return true; // If the file doesn't exist, the schema is technically valid (as we'll create it)
  } catch (error) {
    return false; // JSON parsing failed, so the schema is invalid
  }
}

async function loadConfig(rootPath: string): Promise<Config> {
  const defaultConfig: Config = {
    extensions: [],
    searchPath: ".",
    exclude: [],
  };
  const projectConfigPath = path.join(rootPath, CONFIG_FILE_NAME);
  let config: Config = { ...defaultConfig };

  try {
    if (await fs.pathExists(GLOBAL_CONFIG_PATH)) {
      config = { ...config, ...(await fs.readJson(GLOBAL_CONFIG_PATH)) };
    }
    if (await fs.pathExists(projectConfigPath)) {
      const isValidSchema = await validateConfigSchema(projectConfigPath);
      if (isValidSchema) {
        config = { ...config, ...(await fs.readJson(projectConfigPath)) };
      } else {
        await fs.remove(projectConfigPath);
        vscode.window.showWarningMessage(
          `Your Text Grab configuration file (${CONFIG_FILE_NAME}) in this workspace has an invalid schema and has been reset. Please run 'Text Grab: Initialize Configuration' to create a new one.`
        );
      }
    }

    // Apply template if specified and valid
    if (config.template && DEFAULT_TEMPLATES[config.template]) {
      const template = DEFAULT_TEMPLATES[config.template];
      config.extensions = template.extensions;
      config.exclude = [
        ...new Set([...(config.exclude || []), ...template.exclude]),
      ];
    }
  } catch (error) {
    vscode.window.showWarningMessage(
      `Error loading configuration files. Using default settings. Error: ${
        (error as Error).message
      }`
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
  const absoluteSearchPath = path.isAbsolute(searchPath)
    ? searchPath
    : path.join(rootPath, searchPath);
  const queue = [absoluteSearchPath];
  const excludePatterns = exclude.map(
    (pattern) => new RegExp(pattern.replace(/\*/g, ".*"))
  );

  while (queue.length) {
    const currentPath = queue.shift()!;

    if (
      !(await fs.pathExists(currentPath)) ||
      excludePatterns.some((pattern) => pattern.test(currentPath))
    ) {
      continue;
    }

    try {
      const dirents = await fs.readdir(currentPath, { withFileTypes: true });
      for (const dirent of dirents) {
        const fullPath = path.join(currentPath, dirent.name);

        if (excludePatterns.some((pattern) => pattern.test(fullPath))) {
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

  context.subscriptions.push(
    vscode.commands.registerCommand(copyCommandId, async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }

      const rootPath = workspaceFolder.uri.fsPath;
      const config = await loadConfig(rootPath);

      if (!config.searchPath) {
        vscode.window.showWarningMessage(
          `No 'searchPath' configured in ${CONFIG_FILE_NAME}. Please update your configuration.`
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
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(initCommandId, async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }

      const rootPath = workspaceFolder.uri.fsPath;
      const configPath = path.join(rootPath, CONFIG_FILE_NAME);

      const templateNames = Object.keys(DEFAULT_TEMPLATES);
      const selectedTemplate = await vscode.window.showQuickPick(
        ["None", ...templateNames],
        {
          placeHolder: "Select a default template to initialize with",
        }
      );

      if (selectedTemplate !== undefined) {
        let initialConfig: Config = {
          extensions: [],
          searchPath: ".",
          exclude: [],
        };

        if (
          selectedTemplate !== "None" &&
          DEFAULT_TEMPLATES[selectedTemplate]
        ) {
          initialConfig = {
            extensions: DEFAULT_TEMPLATES[selectedTemplate].extensions,
            searchPath: ".",
            exclude: DEFAULT_TEMPLATES[selectedTemplate].exclude,
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
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(setTemplateCommandId, async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }

      const rootPath = workspaceFolder.uri.fsPath;
      const configPath = path.join(rootPath, CONFIG_FILE_NAME);

      try {
        if (!(await fs.pathExists(configPath))) {
          vscode.window.showErrorMessage(
            `No ${CONFIG_FILE_NAME} found in the workspace. Run 'Text Grab: Initialize Configuration' first.`
          );
          return;
        }

        const config: Config = await fs.readJson(configPath);
        const templateNames = Object.keys(DEFAULT_TEMPLATES);
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

          if (
            selectedTemplate !== "None" &&
            DEFAULT_TEMPLATES[selectedTemplate]
          ) {
            config.extensions = DEFAULT_TEMPLATES[selectedTemplate].extensions;
            config.exclude = [
              ...new Set([
                ...(config.exclude || []),
                ...DEFAULT_TEMPLATES[selectedTemplate].exclude,
              ]),
            ];
          } else {
            config.extensions = [];
            config.exclude = [];
          }

          await fs.writeJson(configPath, config, { spaces: 4 });
          vscode.window.showInformationMessage(
            `Text Grab template set to: ${selectedTemplate}. Extensions and excludes updated.`
          );
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `Failed to update configuration file: ${(error as Error).message}`
        );
      }
    })
  );
}

export function deactivate() {}
