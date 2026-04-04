import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs/promises";
import * as fsSync from "node:fs";

function findTemplatesDir(): string | null {
  const binaryDir = path.dirname(process.execPath);
  const binaryTemplates = path.resolve(binaryDir, "templates");
  const cwdTemplates = path.resolve(process.cwd(), "templates");
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const devTemplates = path.resolve(__dirname, "../../templates");

  const candidates = [binaryTemplates, cwdTemplates, devTemplates];
  for (const dir of candidates) {
    try {
      const stat = fsSync.statSync(dir);
      if (stat.isDirectory()) return dir;
    } catch {}
  }
  return null;
}

const TEMPLATES_DIR = findTemplatesDir();

export async function generateTemplates(projectName: string, date: string): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const files = [
    "project-brief.md",
    "active-context.md",
    "decisions.md",
    "tasks.md",
    "progress.md",
    "_INDEX.md",
  ];

  if (!TEMPLATES_DIR) {
    throw new Error(`TEMPLATES_DIR_NOT_FOUND: Could not locate templates directory`);
  }

  const parsedDate = new Date(date);
  let shortDate = date;
  if (!Number.isNaN(parsedDate.getTime())) {
    shortDate = parsedDate.toISOString().split("T")[0];
  }

  for (const filename of files) {
    const templatePath = path.join(TEMPLATES_DIR, filename);
    try {
      let content = await fs.readFile(templatePath, "utf-8");
      
      content = content.replaceAll("<project-name>", projectName);
      content = content.replaceAll("YYYY-MM-DDTHH:mm:ss.sss+03:00", date);
      content = content.replaceAll("YYYY-MM-DD", shortDate);

      result.set(filename, content);
    } catch (err: any) {
      throw new Error(`TEMPLATE_READ_ERROR: Failed to read template ${filename}: ${err.message}`);
    }
  }

  return result;
}
