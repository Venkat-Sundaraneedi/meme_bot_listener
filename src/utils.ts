import fs from "fs";
import path from "path";

export async function storeData(filePath: string, data: any) {
	try {
		// Ensure directory exists
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		let currentData = [];

		// Read file and parse JSON
		if (fs.existsSync(filePath)) {
			const fileContent = fs.readFileSync(filePath, "utf-8");
			if (fileContent.trim() !== "") {
				try {
					currentData = JSON.parse(fileContent);
				} catch (error) {
					console.error(`Error parsing JSON: ${error.message}`);
					currentData = [];
				}
			}
		}

		// Add new data
		currentData.push(data);

		// Write updated data back to file
		fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2));
		return true;
	} catch (error) {
		console.error(`Error storing data: ${error.message}`);
		return false;
	}
}
