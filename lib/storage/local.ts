import type { StorageAdapter, UploadResult, ListItem } from './types';
import fs from 'fs/promises';
import path from 'path';

function sanitizePathname(pathname: string): string {
  return pathname
    .replace(/\.\./g, '_')
    .replace(/[^a-zA-Z0-9._\-/]/g, '_');
}

function uploadsDir(): string {
  return path.join(process.cwd(), 'public', 'uploads');
}

export class LocalStorageAdapter implements StorageAdapter {
  async upload(
    pathname: string,
    body: Buffer | Blob | File,
    _contentType?: string
  ): Promise<UploadResult> {
    const safe = sanitizePathname(pathname);
    const parts = safe.split('/');
    const dir = path.join(uploadsDir(), ...parts.slice(0, -1));
    const fullPath = path.join(uploadsDir(), ...parts);

    await fs.mkdir(dir, { recursive: true });

    let buffer: Buffer;
    if (Buffer.isBuffer(body)) {
      buffer = body;
    } else {
      buffer = Buffer.from(await (body as Blob).arrayBuffer());
    }

    await fs.writeFile(fullPath, buffer);
    return { url: `/uploads/${safe}`, pathname: safe };
  }

  async delete(urlOrPathname: string): Promise<void> {
    // Support both '/uploads/foo.jpg' and 'foo.jpg'
    const relative = urlOrPathname.startsWith('/uploads/')
      ? urlOrPathname.slice('/uploads/'.length)
      : urlOrPathname;
    const safe = sanitizePathname(relative);
    try {
      await fs.unlink(path.join(uploadsDir(), safe));
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
    }
  }

  async list(prefix?: string, recursive?: boolean): Promise<ListItem[]> {
    const dir = prefix
      ? path.join(uploadsDir(), sanitizePathname(prefix))
      : uploadsDir();

    let files: string[];
    try {
      files = await fs.readdir(dir);
    } catch {
      return [];
    }

    const items: ListItem[] = [];
    for (const file of files) {
      try {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile()) {
          const pathname = prefix ? `${prefix}/${file}` : file;
          items.push({
            url: `/uploads/${pathname}`,
            pathname,
            size: stat.size,
            uploadedAt: stat.mtime,
          });
        } else if (recursive && stat.isDirectory()) {
          // Recursively list subdirectories
          const subItems = await this.list(`${prefix ? prefix + '/' : ''}${file}`, true);
          items.push(...subItems);
        }
      } catch {
        // skip files that error on stat
      }
    }
    return items;
  }
}
