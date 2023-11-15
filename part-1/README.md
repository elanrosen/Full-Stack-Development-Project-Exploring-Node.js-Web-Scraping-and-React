# Data Processing and Pipelining Project: Building a Custom Data Downloader and Processor

Welcome to my Data Processing and Pipelining portion of my project! This part was created as part of my initiative to explore and deepen my understanding of data processing, specifically in handling and manipulating large datasets. It involves building a system to download, decompress, parse, and store large data files in a structured database format.

## Project Goals

The goal of this project is to develop a pipeline that efficiently handles large `.tar.gz` files containing lists of organizations and customers. The primary tasks include:

1. **Downloading and Decompressing Data**: Automating the download of a large `.tar.gz` file, decompressing it, and extracting CSV files contained within.
2. **Data Parsing and Storage**: Parsing the CSV files and inserting the data into a SQLite database, ensuring data integrity and efficient storage.

## Emphasis on Code Quality and Efficiency

- **Language and Style**: The project is developed using TypeScript, emphasizing explicit typing for all variables and functions.
- **Data Handling**: Node.js's Streams API is utilized for efficient processing of large files, a critical aspect given the size of the data involved.
- **Code Style**: A functional, immutable coding style is adopted, using `const` declarations predominantly.

## Implementation

1. **Download Phase**: Utilizes a streaming API to download a data dump from a provided URL. The data is saved to a local temporary directory, ensuring efficient use of resources and handling large files effectively.

2. **Decompression and Extraction**: Employs streaming APIs for decompressing the downloaded GZIP file and extracting the TAR archive. The decompressed content is stored in a specified temporary directory, ready for further processing.

3. **Database Setup**: Involves initializing a SQLite database, which includes the creation of necessary tables and schemas based on the structure of the incoming data.

4. **Data Parsing and Insertion**: Involves reading data from CSV files in the extracted dump. The process uses a streaming CSV parser for efficient memory usage. Data is batch-inserted into the SQLite database, ensuring efficient data transfer and reduced database load. The implementation includes error handling to ensure data integrity during the parsing and insertion process.

## Database Design

- **Table Structure**: The SQLite database is structured with tables corresponding to each CSV file in the data dump. Each table is designed with columns that reflect the data structure in the respective CSV files.

- **Primary Keys**: Each table includes an `id` column, serving as a unique, auto-incrementing primary key.

- **Data Integrity**: All columns are set to be non-nullable by default, promoting data consistency and integrity. This ensures that the database does not store incomplete or inconsistent records.

- **Indexing**: Optional indices are suggested for columns frequently used in queries. This would optimize data retrieval operations, especially beneficial for large datasets. The indices should be chosen based on the specific query patterns observed in the application.

- **Data Types**: The database schema is designed to use appropriate data types for each column, aligning with the data types found in the CSV files.

## Project Highlights

- The project showcases the ability to handle large-scale data processing efficiently.
- It demonstrates skills in TypeScript, Node.js, and database management.
- The implementation focuses on scalability and performance optimization.

This project serves as a testament to my interests and capabilities in managing and processing large datasets, reflecting my initiative to expand my skill set in data handling and full-stack development.

## Testing

To ensure the functionality and reliability of the program, I've implemented a comprehensive testing process. This includes script-based testing and TypeScript compiler checks to validate the code's integrity and performance.

### Script-Based Testing

For a hands-on test of the program, I use the following command:

```sh
tsx runner.ts
```

This command executes a custom script, `runner.ts`, which simulates the entire data processing workflow. It's designed to test the download, decompression, parsing, and database insertion functionalities, providing a practical demonstration of the pipeline's effectiveness.

### TypeScript Compiler Checks

```sh
npx tsc
```

This command invokes the TypeScript compiler with a strict configuration set in the project. It checks for any type inconsistencies or errors in the code, ensuring that the TypeScript standards are  upheld.