/**
 * Memory Store Module
 *
 * This module provides functionality to store and retrieve memory data
 * for cross-task projects and context.
 */
export interface MemoryItem {
    id: string;
    type: 'project' | 'context' | 'note' | 'task';
    title: string;
    description?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    data?: any;
}
export interface MemoryStore {
    items: MemoryItem[];
    lastAccessed: string;
}
/**
 * Initialize the memory store
 * Creates the store file if it doesn't exist
 */
export declare function initMemoryStore(storePath?: string): void;
/**
 * Load the memory store
 */
export declare function loadMemoryStore(storePath?: string): MemoryStore;
/**
 * Save the memory store
 */
export declare function saveMemoryStore(store: MemoryStore, storePath?: string): void;
/**
 * Add a new item to the memory store
 */
export declare function addMemoryItem(item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>, storePath?: string): MemoryItem;
/**
 * Get all items from the memory store
 */
export declare function getAllMemoryItems(storePath?: string): MemoryItem[];
/**
 * Get memory items by type
 */
export declare function getMemoryItemsByType(type: MemoryItem['type'], storePath?: string): MemoryItem[];
/**
 * Get a memory item by ID
 */
export declare function getMemoryItemById(id: string, storePath?: string): MemoryItem | undefined;
/**
 * Update a memory item
 */
export declare function updateMemoryItem(id: string, updates: Partial<Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>>, storePath?: string): MemoryItem | undefined;
/**
 * Delete a memory item
 */
export declare function deleteMemoryItem(id: string, storePath?: string): boolean;
/**
 * Search memory items by title, description, or tags
 */
export declare function searchMemoryItems(query: string, storePath?: string): MemoryItem[];
