export interface UploadResult {
  url: string;
  pathname: string;
}

export interface ListItem {
  url: string;
  pathname: string;
  size?: number;
  uploadedAt?: Date;
}

export interface StorageAdapter {
  upload(
    pathname: string,
    body: Buffer | Blob | File,
    contentType?: string
  ): Promise<UploadResult>;
  delete(urlOrPathname: string): Promise<void>;
  list(prefix?: string, recursive?: boolean): Promise<ListItem[]>;
}
