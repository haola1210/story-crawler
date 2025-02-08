require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const reqPrompt = (s) => `
Create prompts for me to generate images. The prompts must meet the following conditions:

- The timeline of the images must be set in the Northern Song Dynasty of China.
- Result should fit this interface, AND only return the json, nothing else. 
"
{
  image1: string,
  image2: string,
  image3: string,
  image4: string,
  image5: string,
}
"
- Generate 5 images that appropriately illustrate the following story:

content: "${s}"
`;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const outputDir = path.join(__dirname, "data"); // Folder named 'data'
const inputJson = path.join(outputDir, `json-data.json`); // File inside 'data' folder
const outputJson = path.join(outputDir, `prompts-data.json`); // File inside 'data' folder

async function generatePrompt() {
  try {
    console.log("processing...");
    const data = fs.readFileSync(inputJson, "utf8");
    const arr = JSON.parse(data);
    if (!Array.isArray(arr)) return console.log("invalid json-data");

    const container = {};
    let index = 0;
    for (const item of arr) {
      console.log(`generating prompts for chunk ${index + 1}`);
      const result = await model.generateContent(reqPrompt(item));
      // Remove markdown markers
      const promptsObjectString = result.response
        .text()
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
      const promptsObject = JSON.parse(promptsObjectString);
      container[`chunk${index + 1}`] = promptsObject;

      // not last item
      if (index < arr.length) {
        console.log(`Done! Waiting 4 seconds before next chunk...`);
        await delay(4100); // Wait for 4 seconds
        index++;
      }
    }
    console.log("Done All! Saving to prompts-data");
    fs.writeFileSync(outputJson, JSON.stringify(container, null, 2), "utf8");
  } catch (err) {
    console.error(err.message);
  }
}

generatePrompt();
