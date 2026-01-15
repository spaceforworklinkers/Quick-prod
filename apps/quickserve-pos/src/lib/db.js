
import { openDB } from 'idb';

const DB_NAME = 'quickserve-pos-db';
const DB_VERSION = 2;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for menu items (readonly mostly)
      if (!db.objectStoreNames.contains('menu_items')) {
        const store = db.createObjectStore('menu_items', { keyPath: 'id' });
        store.createIndex('restaurant_id', 'restaurant_id', { unique: false });
      }
      // Store for categories
      if (!db.objectStoreNames.contains('categories')) {
        const store = db.createObjectStore('categories', { keyPath: 'id' });
        store.createIndex('restaurant_id', 'restaurant_id', { unique: false });
      }
      // Store for customers
      if (!db.objectStoreNames.contains('customers')) {
        const store = db.createObjectStore('customers', { keyPath: 'id' });
        store.createIndex('mobile', 'mobile', { unique: false }); 
        store.createIndex('restaurant_id', 'restaurant_id', { unique: false });
      }
      // Store for orders (synced)
      if (!db.objectStoreNames.contains('orders')) {
        const store = db.createObjectStore('orders', { keyPath: 'id' });
        store.createIndex('restaurant_id', 'restaurant_id', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
      // Store for pending orders (offline creation)
      if (!db.objectStoreNames.contains('pending_orders')) {
        db.createObjectStore('pending_orders', { keyPath: 'tempId', autoIncrement: true });
      }
      // Store for settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'unique_key' }); 
      }
      // Store for inventory
      if (!db.objectStoreNames.contains('inventory_items')) {
        const store = db.createObjectStore('inventory_items', { keyPath: 'id' });
        store.createIndex('restaurant_id', 'restaurant_id', { unique: false });
      }
      // Store for tables (NEW)
      if (!db.objectStoreNames.contains('restaurant_tables')) {
        const store = db.createObjectStore('restaurant_tables', { keyPath: 'id' });
        store.createIndex('restaurant_id', 'restaurant_id', { unique: false });
      }
    },
  });
};

export const dbOperations = {
  async put(storeName, value) {
    const db = await initDB();
    return db.put(storeName, value);
  },
  
  async get(storeName, key) {
    const db = await initDB();
    return db.get(storeName, key);
  },
  
  async getAll(storeName) {
    const db = await initDB();
    return db.getAll(storeName);
  },
  
  async getByRestaurant(storeName, restaurantId) {
      const db = await initDB();
      // If store has index 'restaurant_id', use it
      return db.getAllFromIndex(storeName, 'restaurant_id', restaurantId);
  },

  async delete(storeName, key) {
      const db = await initDB();
      return db.delete(storeName, key);
  },

  async clear(storeName) {
      const db = await initDB();
      return db.clear(storeName);
  },

  async bulkPut(storeName, items) {
      const db = await initDB();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      await Promise.all([
          ...items.map(item => store.put(item)),
          tx.done
      ]);
  }
};
