import type { StorageAdapter, UploadResult, ListItem } from './types';
import { put, del, list } from '@vercel/blob';

export class BlobStorageAdapter implements StorageAdapter {
  async upload(
    pathname: string,
    body: Buffer | Blob | File,
    contentType?: string,
  ): Promise<UploadResult> {
    const result = await put(pathname, body, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });
    return { url: result.url, pathname: result.pathname };
  }

  async delete(urlOrPathname: string): Promise<void> {
    await del(urlOrPathname);
  }

  /**
   * List all blobs, paginating through the cursor so we never silently
   * drop images when the store has more than 1 000 items.
   * The `recursive` param is accepted for interface compatibility but Vercel
   * Blob stores are inherently flat — prefix filtering is sufficient.
   */
  async list(prefix?: string, _recursive?: boolean): Promise<ListItem[]> {
    const items: ListItem[] = [];
    let cursor: string | undefined;

    do {
      const response = await list({
        prefix,
        cursor,
        limit: 1000,
      });

      for (const b of response.blobs) {
        items.push({
          url: b.url,
          pathname: b.pathname,
          size: b.size,
          uploadedAt: b.uploadedAt,
        });
      }

      cursor = response.cursor;
    } while (cursor);

    return items;
  }
}
