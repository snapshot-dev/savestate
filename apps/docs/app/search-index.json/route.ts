import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

interface SearchEntry {
  title: string;
  description: string;
  url: string;
  content: string;
}

async function findMdxFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? findMdxFiles(entryPath)
        : entry.isFile() && entry.name.endsWith('.mdx')
          ? [entryPath]
          : [];
    }),
  );

  return files.flat();
}

function readFrontmatterValue(frontmatter: string, key: string): string {
  const value = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();
  return value?.replace(/^["']|["']$/g, '') ?? '';
}

function toSearchEntry(filePath: string, content: string, docsDirectory: string): SearchEntry {
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)?.[1] ?? '';
  const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const relativePath = path.relative(docsDirectory, filePath).replace(/\\/g, '/');
  const slug = relativePath
    .replace(/\.mdx$/, '')
    .replace(/(?:^|\/)index$/, '');
  const url = slug ? `/docs/${slug}` : '/docs';
  const text = body
    .replace(/^import\s.+;?\s*$/gm, '')
    .replace(/```[^\n]*\n([\s\S]*?)```/g, ' $1 ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/[`*_>#|[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: readFrontmatterValue(frontmatter, 'title'),
    description: readFrontmatterValue(frontmatter, 'description'),
    url,
    content: text,
  };
}

export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  const docsDirectory = path.join(process.cwd(), 'content', 'docs');
  const files = await findMdxFiles(docsDirectory);
  const entries = await Promise.all(
    files.map(async (filePath) =>
      toSearchEntry(filePath, await readFile(filePath, 'utf8'), docsDirectory),
    ),
  );

  return Response.json(entries);
}
