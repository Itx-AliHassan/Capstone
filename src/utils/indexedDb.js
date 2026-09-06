import { openDB } from 'idb';

const DB_NAME = 'WorkspaceManagerOfflineDB';
const DB_VERSION = 1;

/**
 * Initialize IndexedDB with object stores for cache and mutation queue
 */
export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store 1: General cache for workspaces, projects, tasks
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache');
      }

      // Store 2: Offline mutation queue (FIFO)
      if (!db.objectStoreNames.contains('mutationQueue')) {
        const queueStore = db.createObjectStore('mutationQueue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        queueStore.createIndex('createdAt', 'createdAt');
      }
    },
  });
};

/**
 * Save data to offline cache
 */
export const saveToCache = async (key, data) => {
  try {
    const db = await initDB();
    await db.put('cache', data, key);
  } catch (error) {
    console.error(`[IndexedDB] Error saving cache for ${key}:`, error);
  }
};

/**
 * Retrieve data from offline cache
 */
export const getFromCache = async (key) => {
  try {
    const db = await initDB();
    return await db.get('cache', key);
  } catch (error) {
    console.error(`[IndexedDB] Error getting cache for ${key}:`, error);
    return null;
  }
};

/**
 * Enqueue a mutation while offline
 */
export const enqueueMutation = async ({ type, endpoint, method = 'POST', payload }) => {
  try {
    const db = await initDB();
    const mutation = {
      type,
      endpoint,
      method,
      payload,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    const id = await db.add('mutationQueue', mutation);
    console.log(`[IndexedDB] Enqueued offline mutation #${id}:`, type);
    return { ...mutation, id };
  } catch (error) {
    console.error('[IndexedDB] Failed to enqueue mutation:', error);
    throw error;
  }
};

/**
 * Get all pending offline mutations
 */
export const getPendingMutations = async () => {
  try {
    const db = await initDB();
    return await db.getAll('mutationQueue');
  } catch (error) {
    console.error('[IndexedDB] Failed to get pending mutations:', error);
    return [];
  }
};

/**
 * Remove a completed mutation from queue
 */
export const dequeueMutation = async (id) => {
  try {
    const db = await initDB();
    await db.delete('mutationQueue', id);
  } catch (error) {
    console.error(`[IndexedDB] Failed to dequeue mutation #${id}:`, error);
  }
};

/**
 * Server-authoritative synchronization:
 * Replays queued mutations in sequential FIFO order via Axios.
 * On success, removes from queue. Server responses determine final authoritative state.
 */
export const syncPendingMutations = async (api) => {
  const mutations = await getPendingMutations();
  if (!mutations || mutations.length === 0) {
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (const mutation of mutations) {
    try {
      if (mutation.method === 'POST') {
        await api.post(mutation.endpoint, mutation.payload);
      } else if (mutation.method === 'PUT') {
        await api.put(mutation.endpoint, mutation.payload);
      } else if (mutation.method === 'PATCH') {
        await api.patch(mutation.endpoint, mutation.payload);
      } else if (mutation.method === 'DELETE') {
        await api.delete(mutation.endpoint);
      }

      await dequeueMutation(mutation.id);
      synced++;
    } catch (error) {
      console.error(`[IndexedDB Sync] Failed to replay mutation #${mutation.id}:`, error);
      failed++;
      // Stop on first failure to maintain sequential dependency integrity
      break;
    }
  }

  return { synced, failed };
};
