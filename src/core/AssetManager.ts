export type ImageAssetSource =
  | "upload"
  | "artwork"
  | "generated"
  | "coloring-page"
  | "sticker"
  | "processed";

export interface ImageAssetMetadata {
  id: string;
  name: string;
  source: ImageAssetSource;
  mimeType: string;
  createdAt: string;
}

export interface StoredImageAsset extends ImageAssetMetadata {
  blob: Blob;
}

const databaseName = "create-draw-assets";
const databaseVersion = 1;
const storeName = "images";
let generatedId = 0;

function createAssetId(): string {
  generatedId += 1;
  const randomId = globalThis.crypto?.randomUUID?.();
  return randomId ??
    `asset-${Date.now().toString(36)}-${generatedId.toString(36)}-${Math.random()
      .toString(36)
      .slice(2)}`;
}

export function isImageAssetSource(value: unknown): value is ImageAssetSource {
  return (
    value === "upload" ||
    value === "artwork" ||
    value === "generated" ||
    value === "coloring-page" ||
    value === "sticker" ||
    value === "processed"
  );
}

export function isImageAssetMetadata(value: unknown): value is ImageAssetMetadata {
  if (!value || typeof value !== "object") return false;
  const asset = value as Partial<ImageAssetMetadata>;
  return (
    typeof asset.id === "string" &&
    asset.id.length > 0 &&
    typeof asset.name === "string" &&
    asset.name.length > 0 &&
    isImageAssetSource(asset.source) &&
    typeof asset.mimeType === "string" &&
    asset.mimeType.startsWith("image/") &&
    typeof asset.createdAt === "string"
  );
}

function isStoredImageAsset(value: unknown): value is StoredImageAsset {
  if (!isImageAssetMetadata(value)) return false;
  const asset = value as Partial<StoredImageAsset>;
  return (
    typeof Blob !== "undefined" &&
    asset.blob instanceof Blob &&
    asset.blob.type === asset.mimeType
  );
}

export class AssetManager {
  private databasePromise: Promise<IDBDatabase> | undefined;

  constructor(private readonly indexedDb: IDBFactory | undefined = globalThis.indexedDB) {}

  async saveImage(
    blob: Blob,
    name: string,
    source: ImageAssetSource,
  ): Promise<ImageAssetMetadata> {
    if (!blob.type.startsWith("image/") || blob.size === 0 || !isImageAssetSource(source)) {
      throw new TypeError("Only non-empty image files can be saved as assets.");
    }

    const asset: StoredImageAsset = {
      id: createAssetId(),
      name: name.trim().slice(0, 120) || "Untitled image",
      source,
      mimeType: blob.type,
      createdAt: new Date().toISOString(),
      blob,
    };
    await this.transact("readwrite", (store) => store.add(asset));
    return metadataFrom(asset);
  }

  async getImage(id: string): Promise<StoredImageAsset | undefined> {
    const asset: unknown = await this.transact("readonly", (store) => store.get(id));
    if (asset === undefined) return undefined;
    if (!isStoredImageAsset(asset)) {
      throw new Error("The saved image asset is invalid.");
    }
    return asset;
  }

  async listImages(): Promise<ImageAssetMetadata[]> {
    const assets: unknown = await this.transact("readonly", (store) => store.getAll());
    if (!Array.isArray(assets) || !assets.every(isStoredImageAsset)) {
      throw new Error("The saved image library contains invalid data.");
    }
    return assets
      .map(metadataFrom)
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  }

  async deleteImage(id: string): Promise<void> {
    await this.transact("readwrite", (store) => store.delete(id));
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise;

    const indexedDb = this.indexedDb;
    if (!indexedDb) {
      return Promise.reject(new Error("IndexedDB is unavailable in this browser."));
    }

    const databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDb.open(databaseName, databaseVersion);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(storeName, { keyPath: "id" });
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => {
          database.close();
          this.databasePromise = undefined;
        };
        resolve(database);
      };
      request.onerror = () => {
        reject(request.error ?? new Error("Could not open the image library."));
      };
      request.onblocked = () => {
        reject(new Error("The image library is blocked by another open tab."));
      };
    }).catch((error: unknown) => {
      this.databasePromise = undefined;
      throw error;
    });

    this.databasePromise = databasePromise;
    return databasePromise;
  }

  private async transact<T>(
    mode: IDBTransactionMode,
    makeRequest: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const database = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      let requestResult: { value: T } | undefined;
      transaction.oncomplete = () => {
        if (!requestResult) {
          reject(new Error("The image library transaction completed without a result."));
          return;
        }
        resolve(requestResult.value);
      };
      transaction.onerror = () => {
        reject(transaction.error ?? new Error("The image library transaction failed."));
      };
      transaction.onabort = () => {
        reject(transaction.error ?? new Error("The image library transaction was cancelled."));
      };

      try {
        const request = makeRequest(transaction.objectStore(storeName));
        request.onsuccess = () => {
          requestResult = { value: request.result };
        };
        request.onerror = () => {
          reject(request.error ?? new Error("The image library request failed."));
        };
      } catch (error) {
        reject(error);
      }
    });
  }
}

function metadataFrom(asset: StoredImageAsset): ImageAssetMetadata {
  const { blob: _blob, ...metadata } = asset;
  return metadata;
}
