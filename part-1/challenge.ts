import * as https from 'https';
import * as fs from 'fs';
import * as zlib from 'zlib';
import * as tar from 'tar';
import * as fsExtra from 'fs-extra';
import * as fastCsv from 'fast-csv';
import db from './database';

import { DUMP_DOWNLOAD_URL } from './resources';
import { initializeDatabase } from './database';

/** 
 * Downloads the dump file from the given URL and saves it to the local tmp folder.
 * @param url - The URL from which to download the file.
 * @returns A promise that resolves once the download is complete.
 */
function downloadDumpFile(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream('tmp/dump.tar.gz');

    https.get(url, (response) => {
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', (error) => {
      fs.unlink('tmp/dump.tar.gz', () => {}); // Delete the file if there was an error during download.
      reject(error);
    });
  });
}

/** 
 * Decompresses the downloaded GZIP file and extracts the TAR archive.
 * @returns A promise that resolves once the decompression and extraction is complete.
 */
function decompressAndExtract(): Promise<void> {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream('tmp/dump.tar.gz');
    const gunzip = zlib.createGunzip();
    fileStream.pipe(gunzip)
      .on('error', reject)
      .pipe(tar.extract({ cwd: 'tmp/' }))
      .on('error', reject)
      .on('finish', resolve);
  });
}

/** 
 * Inserts data from a CSV file to the SQLite database table.
 * @param filePath - Path to the CSV file.
 * @param tableName - Name of the table to insert data into.
 * @returns A promise that resolves once data is inserted.
 */
async function insertDataToDatabase(filePath: string, tableName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const rows: any[] = [];

    fs.createReadStream(filePath)
      .pipe(fastCsv.parse({ headers: true, ignoreEmpty: true }))
      .on('data', (row) => rows.push(row))
      .on('data-invalid', (error) => reject(error))
      .on('end', async () => {
        try {
          const CHUNK_SIZE = 100;//used chatgpt for below logic
          const chunks = Array(Math.ceil(rows.length / CHUNK_SIZE)).fill([]).map((_, index) => 
            rows.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE));
          
          await db.transaction(async trx => {
            for (const chunk of chunks) {
              await trx.batchInsert(tableName, chunk);
            }
          });

          resolve();
        } catch (error) {
          reject(error);
        }
      });
  });
}


/**
 * The entry point function. This will download the given dump file, extract/decompress it,
 * parse the CSVs within, and add the data to a SQLite database.
 */
export async function processDataDump() {
  try {
    await fsExtra.ensureDir('tmp/');
    await downloadDumpFile(DUMP_DOWNLOAD_URL);
    console.log('📦 Dump file downloaded successfully!'); //used chatgpt to generate these console logs

    await decompressAndExtract();
    console.log('📂 File decompressed and extracted successfully!');

    await initializeDatabase();
    console.log('🗄️ Database initialized and tables created successfully!');

    await insertDataToDatabase('tmp/dump/customers.csv', 'customers');
    console.log('📝 Customers data inserted successfully!');

    await insertDataToDatabase('tmp/dump/organizations.csv', 'organizations');
    console.log('📝 Organizations data inserted successfully!');
  } catch (error) {
    console.log("⚠️ Error!");
    console.error('Error:', error);
  }
}
