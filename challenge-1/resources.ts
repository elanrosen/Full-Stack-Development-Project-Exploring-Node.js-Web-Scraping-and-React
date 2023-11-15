/**
 * Here's where you can download the .tar.gz file you'll need to start the challenge.
 * This file should be publicly accessible.
 */
export const DUMP_DOWNLOAD_URL: string =
  "https://fiber-challenges.s3.amazonaws.com/dump.tar.gz";

/**
 * Your completed SQLite database should live at this path, relative to
 * the `challenge-1` folder.
 */
export const SQLITE_DB_PATH: string = "out/database.sqlite";

export interface Customer {
  Index: number;
  "Customer Id": string;
  "First Name": string;
  "Last Name": string;
  Company: string;
  City: string;
  Country: string;
  "Phone 1": string;
  "Phone 2": string;
  Email: string;
  "Subscription Date": Date;
  Website: string;
}

// Define an interface for the organization data.
export interface Organization {
  Index: number;
  "Organization Id": string;
  Name: string;
  Website: string;
  Country: string;
  Description: string;
  Founded: number;
  Industry: string;
  "Number of employees": number;
}