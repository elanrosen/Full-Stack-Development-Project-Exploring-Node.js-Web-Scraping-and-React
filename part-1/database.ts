import knex from 'knex';
import * as fsExtra from 'fs-extra';
import { SQLITE_DB_PATH } from './resources';


// Initialize knex configuration for SQLite
const db = knex({ //Chat-gpt this is the knex configuration for sqlite
    client: 'sqlite3',
    connection: {
        filename: SQLITE_DB_PATH
    },
    useNullAsDefault: true // SQLite-specific setting
});

async function dropTables() {
    await db.schema.dropTableIfExists('customers');
    await db.schema.dropTableIfExists('organizations');
}

/**
 * Ensures the required indices are created for optimized queries.
 */
async function ensureIndices(): Promise<void> {
    // Check if the index on the 'Email' column of the 'customers' table exists
    const hasEmailIndex = await db.raw(`SELECT name FROM sqlite_master WHERE type='index' AND name='idx_customers_email' AND tbl_name='customers'`);
    //use chat-gpt for above line
    if (hasEmailIndex.length === 0) {
        // Create an index on the 'Email' column of the 'customers' table
        await db.schema.table('customers', (table) => {
            table.index('Email', 'idx_customers_email'); // Second parameter is the name of the index
        });
    }
}


/**
 * Initializes the SQLite database and creates the required tables if they don't exist.
 */
export async function initializeDatabase(): Promise<void> {
    // Ensure that the directory exists
    await fsExtra.ensureDir('out/');
    await dropTables();

    // Check if the customers table exists and create it if it doesn't
    const hasCustomersTable = await db.schema.hasTable('customers');
    if (!hasCustomersTable) { // used chat-gpt to generate code for creating the tables
        // Create the 'customers' table
        // Create the 'customers' table
        await db.schema.createTable('customers', (table) => {
            table.increments('id').primary(); // Auto-incrementing primary key
            table.integer('Index').notNullable();
            table.string('Customer Id').notNullable();
            table.string('First Name').notNullable();
            table.string('Last Name').notNullable();
            table.string('Company').notNullable();
            table.string('City').notNullable();
            table.string('Country').notNullable();
            table.string('Phone 1').notNullable();
            table.string('Phone 2').notNullable();
            table.string('Email').notNullable();
            table.date('Subscription Date').notNullable();
            table.string('Website').notNullable();
        });

        // Check if the 'organizations' table exists and create it if it doesn't
        const hasOrganizationsTable = await db.schema.hasTable('organizations');
        if (!hasOrganizationsTable) {
            await db.schema.createTable('organizations', (table) => {
                table.increments('id').primary(); // Auto-incrementing primary key
                table.integer('Index').notNullable();
                table.string('Organization Id').notNullable();
                table.string('Name').notNullable();
                table.string('Website').notNullable();
                table.string('Country').notNullable();
                table.string('Description').notNullable();
                table.integer('Founded').notNullable();
                table.string('Industry').notNullable();
                table.integer('Number of employees').notNullable();
            });
        }


    }
    await ensureIndices(); // adds email index
}

export default db; // Exporting the database instance for use in other modules
