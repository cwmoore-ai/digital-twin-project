console.log('memory-store.js is executing');
/**
 * Memory Store Module
 *
 * This module provides functionality to store and retrieve memory data
 * for cross-task projects and context.
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Default memory store path
const MEMORY_STORE_PATH = path.resolve(__dirname, 'memory-store.json');

/**
 * Initialize the memory store
 * Creates the store file if it doesn't exist
 */
export function initMemoryStore(storePath = MEMORY_STORE_PATH) {
    if (!fs.existsSync(storePath)) {
        const initialStore = {
            items: [],
            lastAccessed: new Date().toISOString()
        };
        console.log('__dirname:', __dirname);
        console.log('storePath:', storePath);
        fs.writeFileSync(storePath, JSON.stringify(initialStore, null, 2));
        console.log(`Memory store initialized at ${storePath}`);
    }
}

/**
 * Load the memory store
 */
export function loadMemoryStore(storePath = MEMORY_STORE_PATH) {
    try {
        if (!fs.existsSync(storePath)) {
            initMemoryStore(storePath);
        }
        const data = fs.readFileSync(storePath, 'utf8');
        const store = JSON.parse(data);
        // Update last accessed time
        store.lastAccessed = new Date().toISOString();
        saveMemoryStore(store, storePath);
        return store;
    }
    catch (error) {
        console.error('Error loading memory store:', error);
        return { items: [], lastAccessed: new Date().toISOString() };
    }
}

/**
 * Save the memory store
 */
export function saveMemoryStore(store, storePath = MEMORY_STORE_PATH) {
    try {
        fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
    }
    catch (error) {
        console.error('Error saving memory store:', error);
    }
}

/**
 * Add a new item to the memory store
 */
export function addMemoryItem(item, storePath = MEMORY_STORE_PATH) {
    const store = loadMemoryStore(storePath);
    const newItem = {
        ...item,
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    store.items.push(newItem);
    saveMemoryStore(store, storePath);
    return newItem;
}

/**
 * Get all items from the memory store
 */
export function getAllMemoryItems(storePath = MEMORY_STORE_PATH) {
    const store = loadMemoryStore(storePath);
    return store.items;
}

/**
 * Get memory items by type
 */
export function getMemoryItemsByType(type, storePath = MEMORY_STORE_PATH) {
    const store = loadMemoryStore(storePath);
    return store.items.filter(item => item.type === type);
}

/**
 * Get a memory item by ID
 */
export function getMemoryItemById(id, storePath = MEMORY_STORE_PATH) {
    const store = loadMemoryStore(storePath);
    return store.items.find(item => item.id === id);
}

/**
 * Update a memory item
 */
export function updateMemoryItem(id, updates, storePath = MEMORY_STORE_PATH) {
    const store = loadMemoryStore(storePath);
    const itemIndex = store.items.findIndex(item => item.id === id);
    if (itemIndex === -1) {
        return undefined;
    }
    const updatedItem = {
        ...store.items[itemIndex],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    store.items[itemIndex] = updatedItem;
    saveMemoryStore(store, storePath);
    return updatedItem;
}

/**
 * Delete a memory item
 */
export function deleteMemoryItem(id, storePath = MEMORY_STORE_PATH) {
    const store = loadMemoryStore(storePath);
    const initialLength = store.items.length;
    store.items = store.items.filter(item => item.id !== id);
    if (store.items.length !== initialLength) {
        saveMemoryStore(store, storePath);
        return true;
    }
    return false;
}

/**
 * Search memory items by title, description, or tags
 */
export function searchMemoryItems(query, storePath = MEMORY_STORE_PATH) {
    const store = loadMemoryStore(storePath);
    const lowerQuery = query.toLowerCase();
    return store.items.filter(item => item.title.toLowerCase().includes(lowerQuery) ||
        (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))));
}

/**
 * Generate a unique ID
 */
function generateId() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}
