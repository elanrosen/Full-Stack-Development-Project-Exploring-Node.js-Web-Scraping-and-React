import fsExtra from "fs-extra";

import * as fs from "fs";
import * as fastCsv from "fast-csv";
import { CSV_INPUT_PATH } from "./resources";
import { Cheerio } from "cheerio";
import { CheerioCrawler, RequestQueue } from "crawlee";
import { CheerioAPI, Element } from "cheerio";

const OUTPUT_DIRECTORY = 'out';
const OUTPUT_FILE = `${OUTPUT_DIRECTORY}/scraped.json`;
const DIRECTORY_PATH = "/Users/elan/Documents/challenge/challenge-2/storage/request_queues/default";
const NOT_FOUND_INDEX = -1;
//abstracted these constants to the top, so they can be easily changed if needed

interface CompanyInfo {
  companyName: string;
  ycURL: string;
}

interface Job {
  role: string;
  location: string;
  salaryBandStart: number;
  salaryBandEnd: number;
  salaryCurrency: string; // not catching all edge cases, could refine in future iterations
  equityBandStart: number; // Units are in percentage %, e.g., 0.5% - 1.0%
  equityBandEnd: number;
  desiredExperience: string;
}
interface Socials {
  linkedIn: string;
  twitter: string;
  facebook: string;
  crunchbase: string;
}
interface Founder {
  name: string;
  socials: Socials;
  title: string;
  biography: string;
}
interface LaunchPost {
  title: string;
  description: string;
  link: string;
  details?: LaunchPostDetails;
}
interface LaunchPostDetails {
  title: string;
  postBody: string; // Launch post body text, excludes any html lists
  upVoteCount: number;
  author: string;
  timePostedAgo: string;
  elevatorLine: string;
}

interface AdditionalCompanyInfo {
  batch: string;
  slogan: string;
  operatingStatus: string;
  tags: string[];
  websiteUrl: string;
  description: string;
}
interface NewsPost {
  title: string;
  date: Date;
  link: string;
}

interface ScrapedCompanyInfo {
  name: string;
  yearFounded: Date;
  teamSize: number;
  additionalInfo: AdditionalCompanyInfo;
  socials: Socials;
  jobs: Job[];
  founders: Founder[];
  newsPosts: NewsPost[];
  launchPosts: LaunchPost[];
}


/**
 * Parses the given CSV file and returns an array of company information.
 * @param filePath - The path to the CSV file to parse.
 * @returns A promise that resolves to an array of company information.
 */
async function parseCSV(filePath: string): Promise<CompanyInfo[]> {
  return new Promise((resolve, reject) => {
    const companies: CompanyInfo[] = [];

    fs.createReadStream(filePath)
      .pipe(fastCsv.parse({ headers: true, skipRows: 0 }))
      .on("data", (row) => {
        companies.push({
          companyName: row["Company Name"],
          ycURL: row["YC URL"],
        });
      })
      .on("error", reject)
      .on("end", () => resolve(companies));
  });
}

/**
 * Extracts the slogan from the given CheerioAPI.
 * @param $ - The CheerioAPI.
 * @returns {string} - The extracted slogan.
 */
function extractSlogan($: CheerioAPI): string {
  return $(".prose.hidden.max-w-full.md\\:block .text-xl").text().trim(); // used chat-gpt to generate almost every selector
}

/**
 * Extracts the description from the given CheerioAPI.
 * @param $ - The CheerioAPI.
 * @returns {string} - The extracted description.
 */
function extractDescription($: CheerioAPI): string {
  return $("div.prose.max-w-full p.whitespace-pre-line").text().trim(); //chatgpt
}

/**
 * Extracts the operatingStatus of the company.
 * @param $ - The CheerioAPI.
 * @returns {string} - The operatingStatus of the company, e.g., 'Active', 'Inactive', etc.
 */
function extractStatus($: CheerioAPI): string {
  const acquiredOrInactiveStatus = $("span.ycdc-badge")
    .map((_, element) => $(element).text().trim())
    .get()
    .find(status => ["Acquired", "Inactive"].includes(status));
    // if badge doesn't contain green bubble, set it to 'Acquired' or 'Inactive'
  if (acquiredOrInactiveStatus) {
    return acquiredOrInactiveStatus;
  }

  const operatingStatusElem = $("span.ycdc-badge i");
  // if badge contains green bubble set operatingStatus to the text next to it
  if (operatingStatusElem.hasClass("bg-green-500")) {
    return operatingStatusElem.next().text().trim();
  }

  return ''; // if no status found, return empty string
}

/**
 * Extracts tags and batch details.
 * @param $ - The CheerioAPI.
 * @returns {object} - Object containing tags and batch details.
 */
function extractTagsAndBatch($: CheerioAPI): { tags: string[]; batch: string } {
  const result = $("div.align-center.flex.flex-row.flex-wrap.gap-y-2.gap-x-2 a.ycdc-badge").toArray().reduce<{ tags: string[], batch: string }>((acc, element) => {
    const tagText = $(element).text().trim();
    if (tagText.startsWith("Y Combinator Logo")) {
      acc.batch = tagText.replace("Y Combinator Logo", "").trim();
    } else {
      acc.tags.push(tagText);
    }
    return acc;
  }, { tags: [], batch: "" });

  return result;
}

/**
 * Extracts the website URL from the given CheerioAPI.
 * @param $ - The CheerioAPI.
 * @returns {string} - The extracted website URL.
 */
function extractWebsiteUrl($: CheerioAPI): string {
  return (
    $('div.group.flex.flex-row.items-center a[target="_blank"]').attr("href") ||
    ""
  );
}

/**
 * Extracts additional company information.
 * @param $ - The CheerioAPI.
 * @returns {AdditionalCompanyInfo} - The extracted company information.
 */
function extractAdditionalCompanyInfo($: CheerioAPI): AdditionalCompanyInfo {
  const slogan = extractSlogan($);
  const description = extractDescription($);
  const operatingStatus = extractStatus($);
  const { tags, batch } = extractTagsAndBatch($);
  const websiteUrl = extractWebsiteUrl($);

  return {
    batch,
    slogan,
    description,
    operatingStatus,
    tags,
    websiteUrl,
  };
}

/**
 * Extracts available jobs from the given CheerioAPI.
 * @param $ - The CheerioAPI.
 * @returns {Job[]} - An array of extracted jobs.
 */
function extractJobs($: CheerioAPI): Job[] {
  const jobs: Job[] = [];
  $("div.flex.w-full.flex-row.justify-between.py-4").each(
    (index: number, element: Element) => {
      const details = $(element).find(
        ".justify-left.flex.flex-row.gap-x-7 .list-item"
      );

      const location = details.eq(0).text().trim();
      const salaryDetails =
        details
          .eq(1)
          .text()
          .trim()
          .match(/(\$\d+K?) - (\$\d+K?)/) || [];
      const equityDetails =
        details
          .eq(2)
          .text()
          .trim()
          .match(/(\d+\.\d+)% - (\d+\.\d+)%/) || [];
      const desiredExperience = details.eq(3).text().trim();

      const job: Job = {
        role: $(element).find(".ycdc-with-link-color a").first().text().trim(),
        location: location,
        salaryBandStart: salaryDetails[1]
          ? parseInt(salaryDetails[1].replace("$", "").replace("K", "000"))
          : 0,
        salaryBandEnd: salaryDetails[2]
          ? parseInt(salaryDetails[2].replace("$", "").replace("K", "000"))
          : 0,
        salaryCurrency: "$",
        equityBandStart: equityDetails[1] ? parseFloat(equityDetails[1]) : 0,
        equityBandEnd: equityDetails[2] ? parseFloat(equityDetails[2]) : 0,
        desiredExperience: desiredExperience,
      };

      jobs.push(job);
    }
  );// used chat-gpt to generate this
  return jobs;
}

/**
 * Extracts founder details.
 * @param $ - The CheerioAPI.
 * @returns {Founder[]} - An array of extracted founders.
 */
function extractFounders($: CheerioAPI): Founder[] {
  return $("div.ycdc-card")
    .toArray()
    .slice(1)
    .map((element) => createFounderFromElement($(element), $));
}

/**
 * Creates a founder object from the given element.
 * @param element - The Cheerio element.
 * @param $ - The CheerioAPI.
 * @returns {Founder} - The created founder object.
 */
function createFounderFromElement(
  element: Cheerio<Element>,
  $: CheerioAPI
): Founder {
  return {
    name: extractFounderName(element, $),
    title: extractFounderTitle(element, $),
    biography: extractFounderBiography(element, $),
    socials: extractFounderSocials(element, $),
  };
}

/**
 * Extracts founder name from the given element.
 *
 * @param {Cheerio<Element>} element - The element to extract the name from.
 * @param {CheerioAPI} $ - The Cheerio instance.
 * @returns {string} The extracted name.
 */
function extractFounderName(element: Cheerio<Element>, $: CheerioAPI): string {
  return element.find(".font-bold").text().trim();
}

/**
 * Extracts the founder title from the provided element.
 * NOTE: This works when founder has a title listed. If the company name is in the same place, it'll return the company name.
 *
 * @param {Cheerio<Element>} element - The element to extract the title from.
 * @param {CheerioAPI} $ - The Cheerio instance.
 * @returns {string} The extracted title.
 */
function extractFounderTitle(element: Cheerio<Element>, $: CheerioAPI): string {
  return element.find(".font-bold").next().text().trim();
}

/**
 * Extracts the founder's biography from the provided element.
 *
 * @param {Cheerio<Element>} element - The element to extract the biography from.
 * @param {CheerioAPI} $ - The Cheerio instance.
 * @returns {string} The extracted biography.
 */
function extractFounderBiography(
  element: Cheerio<Element>,
  $: CheerioAPI
): string {
  const biographyContainer = element.prev().find("p.prose").first();
  return biographyContainer.text().trim();
}
/**
 * Extracts the founder's social media links from the provided element.
 *
 * @param {Cheerio<Element>} element - The element to extract social media links from.
 * @param {CheerioAPI} $ - The Cheerio instance.
 * @returns {Socials} An object containing the social media links.
 */
function extractFounderSocials(
  element: Cheerio<Element>,
  $: CheerioAPI
): Socials {
  const founderSocialsContainer = element.find("div.space-x-2");
  return {
    linkedIn: getSocialLink(founderSocialsContainer, "a.bg-image-linkedin", $),
    facebook: getSocialLink(founderSocialsContainer, "a.bg-image-facebook", $),
    twitter: getSocialLink(founderSocialsContainer, "a.bg-image-twitter", $),
    crunchbase: getSocialLink(
      founderSocialsContainer,
      "a.bg-image-crunchbase",
      $
    ),
  };
}

/**
 * Gets the social media link from the provided container using a specific selector.
 *
 * @param {Cheerio<Element>} container - The container to find the social media link in.
 * @param {string} selector - The CSS selector to find the social media link.
 * @param {CheerioAPI} $ - The Cheerio instance.
 * @returns {string} The extracted social media link or an empty string if not found.
 */
function getSocialLink(
  container: Cheerio<Element>,
  selector: string,
  $: CheerioAPI
): string {
  return container.find(selector).attr("href") || "";
}

/**
 * Extracts launch posts from the provided Cheerio instance.
 *
 * @param {CheerioAPI} $ - The Cheerio instance containing the launch posts.
 * @returns {Promise<LaunchPost[]>} A promise that resolves to an array of launch posts.
 */
async function extractLaunchPosts(
  $: CheerioAPI,
  requestQueue: RequestQueue,
  pUrl: string
): Promise<LaunchPost[]> {

  return $("div.company-launch").toArray().map(element => {
    const title = $(element).find("h3").text().trim();
    const description = $(element).find("div.prose").text().trim();
    const linkAttr = $(element).find("a").attr("href");
    const link = linkAttr ? `https://www.ycombinator.com${linkAttr}` : "";

    if (linkAttr) {
      requestQueue.addRequest({
        url: link,
        userData: {
          parentURL: pUrl,
        },
      });
    }

    return {
      title,
      description,
      link,
    };
  });
}

/**
 * Extracts news posts from the provided Cheerio instance.
 *
 * @param {CheerioAPI} $ - The Cheerio instance containing the news posts.
 * @returns {NewsPost[]} An array of news posts.
 */
function extractNewsPosts($: CheerioAPI): NewsPost[] {
  const newsPosts: NewsPost[] = [];
  $("#news > div > div").each((index: number, element: Element) => {
    const titleElement = $(element).find(
      ".ycdc-with-link-color a.prose.font-medium"
    );
    const dateElement = $(element).find(".text-sm");
    const dateString = dateElement.text().trim();

    const newsPost: NewsPost = {
      title: titleElement.text().trim(),
      date: new Date(dateString),
      link: titleElement.attr("href") || "",
    };

    newsPosts.push(newsPost);
  });
  return newsPosts;
}

/**
 * Extracts company social media links from the provided Cheerio instance.
 *
 * @param {CheerioAPI} $ - The Cheerio instance containing the company socials.
 * @returns {Socials | null} An object containing the company's social media links or null.
 */
function extractCompanySocials($: CheerioAPI): Socials | null {
  const socialsContainer = $("div.space-x-2");
  return {
    linkedIn: socialsContainer.find("a.bg-image-linkedin").attr("href") || "",
    facebook: socialsContainer.find("a.bg-image-facebook").attr("href") || "",
    twitter: socialsContainer.find("a.bg-image-twitter").attr("href") || "",
    crunchbase:
      socialsContainer.find("a.bg-image-crunchbase").attr("href") || "",
  };
}

/**
 * Ensures the provided directory path exists, and if not, creates it.
 * @param {string} directoryPath - The path to the directory.
 */
async function ensureDirectoryExists(directoryPath: string) {
  await fsExtra.ensureDir(directoryPath);
}

/**
 * Parses the companies and adds their URLs to the provided request queue.
 * @param {CompanyInfo[]} companies - An array of company information.
 * @param {RequestQueue} requestQueue - The queue to which the company URLs will be added.
 */
async function parseAndAddToQueue(companies: CompanyInfo[], requestQueue: RequestQueue) {
  const promises = companies.map(async company => {
    // console.log("Scraping company:", company.companyName);
    return requestQueue.addRequest({ url: company.ycURL });
  });

  await Promise.all(promises);
}

/**
 * Writes the provided data to the specified output directory and file.
 * @param {ScrapedCompanyInfo[]} data - The scraped company information to be written.
 */
async function writeToOutput(data: ScrapedCompanyInfo[]) {
  await fsExtra.ensureDir(OUTPUT_DIRECTORY);
  await fsExtra.writeJSON(OUTPUT_FILE, data, {
    spaces: 2,
  });
}

/**
 * Processes the details of a company from a parsed webpage and appends this data to the provided data array.
 * 
 * @param {CheerioAPI} $ - The Cheerio instance representing the parsed webpage.
 * @param {ScrapedCompanyInfo[]} scrapedCompaniesData - The array where processed company details will be appended.
 * @param {RequestQueue} requestQueue - A queue to handle any additional requests required during data extraction.
 * @param {string} requestURL - The originating URL from which the data was extracted.
 * 
 * This function extracts specific details about a company such as jobs, founders, posts, social media links, 
 * and other relevant information. It then constructs a consolidated company object and adds it to the 'scrapedCompaniesData' array.
 */
async function handleCompanyDetails($: CheerioAPI, scrapedCompaniesData: ScrapedCompanyInfo[], requestQueue: RequestQueue, requestURL: string) {
  const jobs = extractJobs($);
  const founders = extractFounders($);
  const launchPosts = await extractLaunchPosts($, requestQueue, requestURL);
  const newsPosts = extractNewsPosts($);
  const companySocials = extractCompanySocials($) || {
      linkedIn: "",
      twitter: "",
      facebook: "",
      crunchbase: "",
  };
  const additionalInfo = extractAdditionalCompanyInfo($);
  const yearFoundedText = $('span:contains("Founded:")')
      .next()
      .text()
      .trim();
  const name = $("h1").text().trim();
  const yearFounded = new Date(yearFoundedText);
  const teamSize = parseInt(
      $('span:contains("Team Size:")').next().text().trim(),
      10
  );

  scrapedCompaniesData.push({
      name: name,
      yearFounded: yearFounded,
      teamSize: teamSize,
      additionalInfo: additionalInfo,
      socials: companySocials,
      jobs: jobs,
      founders: founders,
      newsPosts: newsPosts,
      launchPosts: launchPosts,
  });
}

/**
 * Extracts and assigns details of a launch post from the provided HTML markup using Cheerio.
 * The details extracted include the post title, author, upvote count, post time, elevator pitch, and body.
 * After extracting, the function matches the post details with a company from the provided data 
 * based on the request URL and updates the post details for that company.
 * 
 * @param {$} CheerioAPI - The Cheerio instance with loaded HTML content.
 * @param {requestURL} string - The URL used to request the launch post details.
 * @param {scrapedCompaniesData} ScrapedCompanyInfo[] - Array of scraped company information, including launch posts.
 */
function handleLaunchDetails($: CheerioAPI, requestURL: string, scrapedCompaniesData: ScrapedCompanyInfo[]) {
  const title = $("div.title-container h1").text().trim();
  const author = $("div.flex-flow-wrap div.align-center b")
      .text()
      .trim();
  const upVoteCount = parseInt(
      $(".vote-count-container div").last().text().trim(),
      10
  );
  const timePostedAgo = $(".timeago").text().trim();
  const elevatorLine = $(".tagline").text().trim();
  const paragraphs = $("div > p:not(:last-child)")
      .map((i: any, el: any) => $(el).text().trim())
      .get();
  const postBody = paragraphs.slice(1).join("\n\n");

  const launchPostDetails = {
      title: title,
      postBody: postBody,
      upVoteCount: upVoteCount,
      author: author,
      timePostedAgo: timePostedAgo,
      elevatorLine: elevatorLine,
  };
  // finds company based off the request parent URL and updates the post details
  const companyInfo = scrapedCompaniesData.find(
      (company) => company.launchPosts.some((post: LaunchPost) => post.link === requestURL)
  );
  if (companyInfo) { 
      const launchPost = companyInfo.launchPosts.find((post: LaunchPost) => post.link === requestURL);
      if (launchPost) {
          launchPost.details = launchPostDetails;
      }
  }
}

/**
 * Orchestrates the end-to-end process of scraping companies' information. It initializes necessary prerequisites 
 * like ensuring a directory exists for output, parses an input CSV of companies to scrape, initializes a request 
 * queue for the scraping process, and sets up the scraper (CheerioCrawler). Once data scraping is done, 
 * it writes the aggregated data to an output file.
 */
export async function processCompanyList() {
  try {
    await ensureDirectoryExists(DIRECTORY_PATH);

    const companies = await parseCSV(CSV_INPUT_PATH);
    const requestQueue = await RequestQueue.open();

    const scrapedCompaniesData: ScrapedCompanyInfo[] = [];

    const crawler = new CheerioCrawler({
      requestQueue,
      maxRequestsPerMinute: 250,
      maxConcurrency: 10,
      async requestHandler({ $, request }) {
        try {
          //checks whether its a launch post or company details page
          if (request.url.indexOf("www.ycombinator.com/launches/") === NOT_FOUND_INDEX) {
            handleCompanyDetails($, scrapedCompaniesData, requestQueue, request.url);
          } else {
            handleLaunchDetails($, request.url, scrapedCompaniesData);
          }
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
    });

    await parseAndAddToQueue(companies, requestQueue);
    await crawler.run();

    await writeToOutput(scrapedCompaniesData);
    console.log(scrapedCompaniesData.length);
  } catch (error) {
    console.error("Error processing the company list:", error);
  }
}