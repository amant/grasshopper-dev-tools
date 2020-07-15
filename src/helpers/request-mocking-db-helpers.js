import { openDB } from 'idb';
export const DB_GROUP_NAME = 'grasshopper-db';
export const DB_TABLE_NAME = 'mock-requests'

export const db1 =  openDB(DB_GROUP_NAME, 1, {
    upgrade(db) {
        db.createObjectStore(DB_TABLE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
        });
    }
});

export const db = {
    add: async (data) => (await db1).add(DB_TABLE_NAME, data),
    getAll: async () => (await db1).getAll(DB_TABLE_NAME),
};
