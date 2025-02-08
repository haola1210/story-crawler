const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const url =
  "https://truyenfull.bio/xuyen-khong-vuong-gia-vo-dung-lot-xac/chuong-1/"; // Replace with your target URL

const selector = "#chapter-c";
const fileName = "xuyen-khong-vuong-gia-vo-dung-lot-xac_chuong-1";
const chunkSize = 500; // Max character per chunk

const outputDir = path.join(__dirname, "data"); // Folder named 'data'
const outputFile = path.join(outputDir, `${fileName}.txt`); // File inside 'data' folder
const outputJson = path.join(outputDir, `json-data.json`); // File inside 'data' folder

const chunkData = (cleanText) => {
  // Split text into sentences
  const sentences = cleanText.split(/(?<=[.!?])\s+/); // Keeps punctuation

  // Group sentences into chunks ≤ chunkSize characters
  let chunks = [];
  let currentChunk = "";

  sentences.forEach((sentence) => {
    if ((currentChunk + sentence).length <= chunkSize) {
      currentChunk += (currentChunk ? " " : "") + sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    }
  });

  if (currentChunk) chunks.push(currentChunk); // Add last chunk

  let mergedData = "START___############### Đoạn 1 ############### \n\n";
  chunks.forEach((chunk, index) => {
    mergedData += chunk;
    mergedData += `\n\nEND___############### Đoạn ${
      index + 1
    } ############### \n\n`;

    mergedData += `PROMPT Cho Đoạn ${index + 1}:\n@@@@@@_PROMPT_${
      index + 1
    }_@@@@@@\n\n`;

    if (index !== chunks.length - 1) {
      mergedData += `START___############### Đoạn ${
        index + 2
      } ############### \n\n`;
    }
  });
  return {
    mergedData,
    chunks,
  };
};

async function crawlWebsite() {
  try {
    console.log("crawling...");
    const { data } = await axios.get(url, {
      // headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }, // Mimic a browser
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      }, // Mimic a browser
    });
    console.log("done crawl. processing...");

    const $ = cheerio.load(data);

    const chapterDiv = $(selector);

    if (chapterDiv.length) {
      // Remove all empty elements inside the div
      chapterDiv.find("div, span").each(function () {
        if (!$(this).text().trim()) {
          $(this).remove();
        }
      });

      // Add line breaks after specific tags
      chapterDiv
        .find("p, br, div, li, h1, h2, h3, h4, h5, h6")
        .each(function () {
          $(this).after("\n"); // Add a newline after each of these elements
        });

      // Get the clean text with preserved line breaks
      const cleanText = chapterDiv
        .text()
        .replace(/\n\s*\n/g, "\n")
        .trim(); // Remove extra empty lines

      // Ensure the 'data' folder exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      const { chunks, mergedData } = chunkData(cleanText);
      // Save the content to the file inside 'data' folder
      fs.writeFileSync(outputFile, mergedData, "utf8");

      fs.writeFileSync(outputJson, JSON.stringify(chunks), "utf8");

      console.log(`Content saved to ${outputFile}`);
    } else {
      console.log(`No content found inside ${selector}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.code === "ETIMEDOUT") {
      console.log(
        "⚠️ Connection timed out. Try using a VPN or different network."
      );
    } else if (error.response && error.response.status === 403) {
      console.log(
        "⚠️ Access forbidden! The website might be blocking crawlers."
      );
    }
  }
}

crawlWebsite();
