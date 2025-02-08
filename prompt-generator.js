require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const fileName = "xuyen-khong-vuong-gia-vo-dung-lot-xac_chuong-1";

const reqPrompt = (s) => `
Create prompts for me to generate images. The prompts must meet the following conditions:

- The timeline of the images must be set in the Northern Song Dynasty of China.
- Result should fit this interface, AND only return the json, nothing else. 
"
{
  image: string,
"
- Generate an images that appropriately illustrate the following story paragraph:

content: "${s}"
`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const outputDir = path.join(__dirname, "data"); // Folder named 'data'
const inputJson = path.join(outputDir, `json-data.json`); // File inside 'data' folder
const outputFile = path.join(outputDir, `${fileName}.txt`); // File inside 'data' folder

async function generatePrompt() {
  try {
    console.log("processing...");
    const data = fs.readFileSync(inputJson, "utf8");
    const arr = JSON.parse(data);
    if (!Array.isArray(arr)) return console.log("invalid json-data");

    const container = [];
    let index = 0;
    for (const item of arr) {
      console.log(`generating prompts for chunk ${index + 1}`);
      const result = await model.generateContent(reqPrompt(item));
      // Remove markdown markers
      const promptsObjectString = result.response
        .text()
        .replace(/^```json\s*/, "")
        .replaceAll("```", "")
        .trim();
      // console.log(promptsObjectString);
      const promptsObject = JSON.parse(promptsObjectString);

      container.push(promptsObject.image);

      // not last item
      if (index < arr.length) {
        console.log(`Done! Waiting 4 seconds before next chunk...`);
        await delay(4000); // Wait for 4 seconds
        index++;
      }
    }
    console.log("Done! Saving prompts to content file");

    let content = fs.readFileSync(outputFile, "utf8");
    container.forEach((prompt, index) => {
      content = content.replace(`@@@@@@_PROMPT_${index + 1}_@@@@@@`, prompt);
    });
    fs.writeFileSync(outputFile, content, "utf8");
    console.log("DONE ALL !!!");
  } catch (err) {
    console.error(err.message);
  }
}

generatePrompt();
