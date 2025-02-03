import fs from "fs";
import path from "path";

export async function storeData(filePath: string, data: any) {
  try {
    const fileExists = fs.existsSync(filePath);
    let currentData = [];

    if (fileExists) {
      const rawData = fs.readFileSync(filePath, "utf-8");
      currentData = JSON.parse(rawData);
    }

    currentData.push(data);
    fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
    console.log(`Data stored successfully at ${filePath}`);
  } catch (error) {
    console.error(`Error storing data: ${error.message}`);
  }
}
