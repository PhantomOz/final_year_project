import { openDB } from "idb";
import api from "./api";

const DB_NAME = "pos_system";
const DB_VERSION = 1;

export const initDB = async () => {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores
      if (!db.objectStoreNames.contains("transactions")) {
        db.createObjectStore("transactions", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains("products")) {
        db.createObjectStore("products", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("pending_sync")) {
        db.createObjectStore("pending_sync", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    },
  });
  return db;
};

export const saveOfflineTransaction = async (transaction) => {
  const db = await initDB();
  await db.add("transactions", transaction);
  await db.add("pending_sync", {
    type: "transaction",
    data: transaction,
    timestamp: Date.now(),
  });
};

export const syncOfflineData = async () => {
  const db = await initDB();
  const pendingSync = await db.getAll("pending_sync");

  for (const item of pendingSync) {
    try {
      // Attempt to sync with server
      await syncItemWithServer(item);
      // If successful, remove from pending_sync
      await db.delete("pending_sync", item.id);
    } catch (error) {
      console.error("Sync failed for item:", item, error);
    }
  }
};

const syncItemWithServer = async (item) => {
  // Implement server sync logic based on item type
  switch (item.type) {
    case "transaction":
      await api.post("/transactions", item.data);
      break;
    // Add other cases as needed
    default:
      throw new Error(`Unknown sync item type: ${item.type}`);
  }
};
