import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "copy-files-content.copyFilesContent",
    async () => {
      // Check if a workspace is open
      if (!vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder open.");
        return;
      }

      // Get user input
      const includePattern = await vscode.window.showInputBox({
        prompt: "Enter file patterns to include (e.g., *.ts, *.js)",
        placeHolder: "*.ts, *.js",
      });
      if (!includePattern) return;

      const excludePattern = await vscode.window.showInputBox({
        prompt: "Enter folders/files to exclude (e.g., node_modules, dist)",
        placeHolder: "node_modules, dist",
      });

      try {
        const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const includePatterns = includePattern.split(",").map((p) => p.trim());
        const excludePatterns = excludePattern
          ? excludePattern.split(",").map((p) => p.trim())
          : [];

        // Process files and collect content
        const content = await processFiles(
          rootPath,
          includePatterns,
          excludePatterns
        );

        // Copy to clipboard
        await vscode.env.clipboard.writeText(content);
        vscode.window.showInformationMessage(
          "File contents copied to clipboard!"
        );
      } catch (error) {
        const err = error as Error;
        vscode.window.showErrorMessage(`Error: ${err.message}`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

async function processFiles(
  dir: string,
  includePatterns: string[],
  excludePatterns: string[]
): Promise<string> {
  const results: string[] = [];
  const dirents = await fs.readdir(dir, { withFileTypes: true });

  // Process files in batches to optimize memory
  for (const dirent of dirents) {
    const fullPath = path.join(dir, dirent.name);

    // Skip excluded patterns
    if (excludePatterns.some((pattern) => fullPath.includes(pattern))) {
      continue;
    }

    if (dirent.isDirectory()) {
      // Recursively process subdirectories
      const subContent = await processFiles(
        fullPath,
        includePatterns,
        excludePatterns
      );
      if (subContent) results.push(subContent);
    } else if (
      dirent.isFile() &&
      matchesPattern(dirent.name, includePatterns)
    ) {
      // Read file content efficiently
      const content = await fs.readFile(fullPath, "utf8");
      results.push(`// File: ${fullPath}\n${content}\n`);
    }
  }

  return results.join("\n");
}

// Check if a file matches any of the include patterns
function matchesPattern(fileName: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    return regex.test(fileName);
  });
}

export function deactivate() {}
