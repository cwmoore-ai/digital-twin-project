#!/usr/bin/env node
/**
 * Digital Twin MCP Server
 *
 * This is a simplified implementation of an MCP server for the Digital Twin project.
 * It defines the tools that would be available for interacting with the Digital Twin components.
 *
 * Enhanced with working memory to remember cross-task projects and context.
 */
import * as memoryStore from './memory-store.js';
// Mock implementation of the MCP server
class DigitalTwinServer {
    constructor() {
        console.log('Digital Twin MCP Server initialized');
        // Initialize the memory store
        memoryStore.initMemoryStore();
        console.log('Memory store initialized');
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        process.on('SIGINT', () => {
            console.log('Shutting down Digital Twin MCP Server');
            process.exit(0);
        });
        // Handle stdin/stdout communication
        process.stdin.on('data', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(message);
            }
            catch (error) {
                console.error('Error parsing message:', error);
            }
        });
    }
    handleMessage(message) {
        if (message.method === 'list_tools') {
            this.sendResponse(message.id, {
                tools: this.getAvailableTools()
            });
        }
        else if (message.method === 'call_tool') {
            this.handleToolCall(message);
        }
        else {
            this.sendError(message.id, 'Method not supported');
        }
    }
    getTasks() {
        console.log('getTasks called'); // ADDED
        const allItems = memoryStore.getAllMemoryItems();
        const tasks = allItems.filter((item) => item.type === 'task');
        return tasks;
    }
    handleToolCall(message) {
        const { name, arguments: args } = message.params;
        console.log(`handleToolCall: name=${name}`); // ADDED
        if (name === 'get_tasks') {
            console.log('handleToolCall: get_tasks called'); // ADDED
            const tasks = this.getTasks();
            this.sendResponse(message.id, {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(tasks, null, 2),
                    },
                ],
                data: tasks,
            });
        }
        // Handle memory-related tools
        else if (name.startsWith('memory_')) {
            try {
                const result = this.handleMemoryTool(name, args);
                this.sendResponse(message.id, {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                });
                return;
            }
            catch (error) {
                this.sendError(message.id, `Error handling memory tool: ${error.message}`);
                return;
            }
        }
        // Handle other tools (placeholder implementation)
        else if (name === 'memory_get_all') {
            const memoryItems = this.handleMemoryTool(name, args);
            this.sendResponse(message.id, {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(memoryItems, null, 2),
                    },
                ],
                data: memoryItems,
            });
        }
        else {
            this.sendResponse(message.id, {
                content: [
                    {
                        type: 'text',
                        text: `Tool '${name}' was called with arguments: ${JSON.stringify(args, null, 2)}. This is a placeholder response as the actual implementation would require integration with the Digital Twin components.`,
                    },
                ],
            });
        }
    }
    handleMemoryTool(name, args) {
        switch (name) {
            case 'memory_get_all':
                const allItems = memoryStore.getAllMemoryItems();
                console.log('memory_get_all items:', allItems); // ADDED
                return { items: allItems };
            case 'memory_get_by_type':
                if (!args.type) {
                    throw new Error('Type is required');
                }
                return { items: memoryStore.getMemoryItemsByType(args.type) };
            case 'memory_get_by_id':
                if (!args.id) {
                    throw new Error('ID is required');
                }
                const item = memoryStore.getMemoryItemById(args.id);
                if (!item) {
                    throw new Error(`Item with ID ${args.id} not found`);
                }
                return { item };
            case 'memory_add':
                if (!args.title || !args.type) {
                    throw new Error('Title and type are required');
                }
                const newItem = memoryStore.addMemoryItem({
                    type: args.type,
                    title: args.title,
                    description: args.description,
                    tags: args.tags,
                    data: args.data
                });
                return { item: newItem };
            case 'memory_update':
                if (!args.id) {
                    throw new Error('ID is required');
                }
                const updatedItem = memoryStore.updateMemoryItem(args.id, {
                    title: args.title,
                    description: args.description,
                    tags: args.tags,
                    data: args.data
                });
                if (!updatedItem) {
                    throw new Error(`Item with ID ${args.id} not found`);
                }
                return { item: updatedItem };
            case 'memory_delete':
                if (!args.id) {
                    throw new Error('ID is required');
                }
                const deleted = memoryStore.deleteMemoryItem(args.id);
                if (!deleted) {
                    throw new Error(`Item with ID ${args.id} not found`);
                }
                return { success: true };
            case 'memory_search':
                if (!args.query) {
                    throw new Error('Query is required');
                }
                return { items: memoryStore.searchMemoryItems(args.query) };
            default:
                throw new Error(`Unknown memory tool: ${name}`);
        }
    }
    sendResponse(id, result) {
        const response = {
            jsonrpc: '2.0',
            id,
            result
        };
        process.stdout.write(JSON.stringify(response) + '\n');
    }
    sendError(id, message) {
        const response = {
            jsonrpc: '2.0',
            id,
            error: {
                code: -32601,
                message
            }
        };
        process.stdout.write(JSON.stringify(response) + '\n');
    }
    getAvailableTools() {
        return [
            // Memory-related tools
            {
                name: 'memory_get_all',
                description: 'Get all items from the memory store',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'memory_get_by_type',
                description: 'Get memory items by type',
                inputSchema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            description: 'Item type (project, context, note)',
                            enum: ['project', 'context', 'note'],
                        },
                    },
                    required: ['type'],
                },
            },
            {
                name: 'memory_get_by_id',
                description: 'Get a memory item by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Item ID',
                        },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'memory_add',
                description: 'Add a new item to the memory store',
                inputSchema: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            description: 'Item type',
                            enum: ['project', 'context', 'note'],
                        },
                        title: {
                            type: 'string',
                            description: 'Item title',
                        },
                        description: {
                            type: 'string',
                            description: 'Item description',
                        },
                        tags: {
                            type: 'array',
                            description: 'Item tags',
                            items: {
                                type: 'string',
                            },
                        },
                        data: {
                            type: 'object',
                            description: 'Additional data for the item',
                        },
                    },
                    required: ['type', 'title'],
                },
            },
            {
                name: 'memory_update',
                description: 'Update a memory item',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Item ID',
                        },
                        title: {
                            type: 'string',
                            description: 'Item title',
                        },
                        description: {
                            type: 'string',
                            description: 'Item description',
                        },
                        tags: {
                            type: 'array',
                            description: 'Item tags',
                            items: {
                                type: 'string',
                            },
                        },
                        data: {
                            type: 'object',
                            description: 'Additional data for the item',
                        },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'memory_delete',
                description: 'Delete a memory item',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Item ID',
                        },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'memory_search',
                description: 'Search memory items by title, description, or tags',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Search query',
                        },
                    },
                    required: ['query'],
                },
            },
            // Original tools
            {
                name: 'get_tasks',
                description: 'Get all tasks from the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {
                        filter: {
                            type: 'string',
                            description: 'Filter tasks by status (all, active, completed)',
                            enum: ['all', 'active', 'completed'],
                        },
                    },
                },
            },
            {
                name: 'add_task',
                description: 'Add a new task to the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description: 'Task title',
                        },
                        description: {
                            type: 'string',
                            description: 'Task description',
                        },
                        dueDate: {
                            type: 'string',
                            description: 'Due date in YYYY-MM-DD format',
                        },
                        priority: {
                            type: 'string',
                            description: 'Task priority',
                            enum: ['low', 'medium', 'high'],
                        },
                    },
                    required: ['title'],
                },
            },
            {
                name: 'update_task',
                description: 'Update an existing task in the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Task ID',
                        },
                        title: {
                            type: 'string',
                            description: 'Task title',
                        },
                        description: {
                            type: 'string',
                            description: 'Task description',
                        },
                        dueDate: {
                            type: 'string',
                            description: 'Due date in YYYY-MM-DD format',
                        },
                        priority: {
                            type: 'string',
                            description: 'Task priority',
                            enum: ['low', 'medium', 'high'],
                        },
                        completed: {
                            type: 'boolean',
                            description: 'Task completion status',
                        },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'delete_task',
                description: 'Delete a task from the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Task ID',
                        },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'get_timer_status',
                description: 'Get the current timer status from the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'start_timer',
                description: 'Start the Pomodoro timer',
                inputSchema: {
                    type: 'object',
                    properties: {
                        mode: {
                            type: 'string',
                            description: 'Timer mode',
                            enum: ['pomodoro', 'shortBreak', 'longBreak'],
                        },
                    },
                },
            },
            {
                name: 'pause_timer',
                description: 'Pause the Pomodoro timer',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'reset_timer',
                description: 'Reset the Pomodoro timer',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'get_goals',
                description: 'Get all goals from the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            description: 'Filter goals by status',
                            enum: ['current', 'completed', 'all'],
                        },
                    },
                },
            },
            {
                name: 'add_goal',
                description: 'Add a new goal to the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description: 'Goal title',
                        },
                        timeframe: {
                            type: 'string',
                            description: 'Goal timeframe',
                            enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
                        },
                    },
                    required: ['title', 'timeframe'],
                },
            },
            {
                name: 'update_goal',
                description: 'Update an existing goal in the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Goal ID',
                        },
                        title: {
                            type: 'string',
                            description: 'Goal title',
                        },
                        timeframe: {
                            type: 'string',
                            description: 'Goal timeframe',
                            enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
                        },
                        completed: {
                            type: 'boolean',
                            description: 'Goal completion status',
                        },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'delete_goal',
                description: 'Delete a goal from the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Goal ID',
                        },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'get_notes',
                description: 'Get all notes from the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {
                        search: {
                            type: 'string',
                            description: 'Search term for filtering notes',
                        },
                    },
                },
            },
            {
                name: 'get_note',
                description: 'Get a specific note from the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Note ID',
                        },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'add_note',
                description: 'Add a new note to the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description: 'Habit name',
                        },
                    },
                    required: ['name'],
                },
            },
            {
                name: 'track_habit',
                description: 'Track a habit for today',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Habit ID',
                        },
                        completed: {
                            type: 'boolean',
                            description: 'Whether the habit was completed',
                        },
                    },
                    required: ['id', 'completed'],
                },
            },
            {
                name: 'delete_habit',
                description: 'Delete a habit from the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Habit ID',
                        },
                    },
                    required: ['id'],
                },
            },
            {
                name: 'get_settings',
                description: 'Get the current settings from the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'update_settings',
                description: 'Update the settings in the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {
                        userName: {
                            type: 'string',
                            description: 'User name',
                        },
                        pomodoroDuration: {
                            type: 'number',
                            description: 'Pomodoro duration in minutes',
                        },
                        shortBreakDuration: {
                            type: 'number',
                            description: 'Short break duration in minutes',
                        },
                        longBreakDuration: {
                            type: 'number',
                            description: 'Long break duration in minutes',
                        },
                        autoStartBreaks: {
                            type: 'boolean',
                            description: 'Auto-start breaks',
                        },
                        enableNotifications: {
                            type: 'boolean',
                            description: 'Enable notifications',
                        },
                        notificationSound: {
                            type: 'string',
                            description: 'Notification sound',
                            enum: ['bell', 'chime', 'ding', 'none'],
                        },
                        theme: {
                            type: 'string',
                            description: 'App theme',
                            enum: ['light', 'dark', 'system'],
                        },
                        accentColor: {
                            type: 'string',
                            description: 'Accent color (hex)',
                        },
                    },
                },
            },
            {
                name: 'export_data',
                description: 'Export all data from the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'import_data',
                description: 'Import data into the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'string',
                            description: 'JSON string of data to import',
                        },
                    },
                    required: ['data'],
                },
            },
            {
                name: 'clear_data',
                description: 'Clear all data from the Digital Twin',
                inputSchema: {
                    type: 'object',
                    properties: {
                        confirm: {
                            type: 'boolean',
                            description: 'Confirmation to clear all data',
                        },
                    },
                    required: ['confirm'],
                },
            },
            {
                name: 'get_dashboard_summary',
                description: 'Get a summary of the dashboard data',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'set_focus',
                description: 'Set the main focus for today',
                inputSchema: {
                    type: 'object',
                    properties: {
                        focus: {
                            type: 'string',
                            description: 'Main focus text',
                        },
                    },
                    required: ['focus'],
                },
            },
        ];
    }
    run() {
        console.log('Digital Twin MCP Server running');
    }
}
// Start the server
const server = new DigitalTwinServer();
server.run();
