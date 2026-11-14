import assert from "node:assert/strict";
import test from "node:test";
import { AssetManager } from "../browser-build/core/AssetManager.js";

class FakeRequest {
  result;
  error;
  onsuccess;
  onerror;
  onupgradeneeded;
}

class FakeStore {
  constructor(values, transaction) {
    this.values = values;
    this.transaction = transaction;
  }

  add(value) {
    return this.request(() => {
      if (this.values.has(value.id)) throw new Error("Duplicate asset id.");
      this.values.set(value.id, value);
      return value.id;
    });
  }

  get(id) {
    return this.request(() => this.values.get(id));
  }

  getAll() {
    return this.request(() => Array.from(this.values.values()));
  }

  delete(id) {
    return this.request(() => {
      this.values.delete(id);
      return undefined;
    });
  }

  request(operation) {
    const request = new FakeRequest();
    queueMicrotask(() => {
      try {
        request.result = operation();
        request.onsuccess?.();
        this.transaction.oncomplete?.();
      } catch (error) {
        request.error = error;
        request.onerror?.();
        this.transaction.onerror?.();
      }
    });
    return request;
  }
}

class FakeDatabase {
  constructor(values = new Map()) {
    this.values = values;
  }

  createObjectStore() {}

  transaction() {
    const transaction = {
      oncomplete: undefined,
      onerror: undefined,
      onabort: undefined,
      objectStore: () => new FakeStore(this.values, transaction),
    };
    return transaction;
  }

  close() {}
}

class FakeIndexedDb {
  constructor() {
    this.values = new Map();
  }

  open() {
    const request = new FakeRequest();
    queueMicrotask(() => {
      request.result = new FakeDatabase(this.values);
      request.onupgradeneeded?.();
      request.onsuccess?.();
    });
    return request;
  }
}

test("stores, lists, retrieves, and deletes image assets", async () => {
  const manager = new AssetManager(new FakeIndexedDb());
  const blob = new Blob(["image data"], { type: "image/png" });

  const saved = await manager.saveImage(blob, "  dragon.png  ", "upload");
  assert.equal(saved.name, "dragon.png");
  assert.equal(saved.source, "upload");
  assert.equal((await manager.listImages()).length, 1);
  assert.equal((await manager.getImage(saved.id))?.blob, blob);

  await manager.deleteImage(saved.id);
  assert.deepEqual(await manager.listImages(), []);
  assert.equal(await manager.getImage(saved.id), undefined);
});

test("rejects non-image and empty image assets", async () => {
  const manager = new AssetManager(new FakeIndexedDb());
  await assert.rejects(
    manager.saveImage(new Blob(["text"], { type: "text/plain" }), "notes.txt", "upload"),
    TypeError,
  );
  await assert.rejects(
    manager.saveImage(new Blob([], { type: "image/png" }), "empty.png", "upload"),
    TypeError,
  );
  await assert.rejects(
    manager.saveImage(new Blob(["data"], { type: "image/png" }), "image.png", "unknown"),
    TypeError,
  );
});

test("reports IndexedDB unavailability without hiding the failure", async () => {
  const manager = new AssetManager(undefined);
  await assert.rejects(manager.listImages(), /IndexedDB is unavailable/);
});
