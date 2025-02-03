import { PUMP_PORTAL_WS_URL } from "./config";
import { storeData } from "./utils";
import WebSocket from "ws";
import chalk from "chalk";
import path from "path";

const dataPath = path.join(__dirname, "data", "new_coins.json");

// Function to monitor new tokens
async function monitorNewTokens() {
	console.log(chalk.green("Connecting to PumpPortal WebSocket..."));

	const ws = new WebSocket(PUMP_PORTAL_WS_URL);

	ws.on("open", () => {
		console.log(chalk.green("Connected to PumpPortal WebSocket!"));

		// Subscribe to new token creation events
		ws.send(
			JSON.stringify({
				method: "subscribeNewToken",
			}),
		);
	});

	ws.on("message", (data) => {
		try {
			const message = JSON.parse(data.toString());
			console.log(chalk.bgGreen(`Received new token event:`), message);

			// Create token data object
			const tokenData = {
				timestamp: new Date().toISOString(),
				mintAddress: message.data.mint,
				tokenInfo: message.data,
			};

			// Store token data
			storeData(dataPath, tokenData);
		} catch (error) {
			console.error(
				chalk.red(`Error processing token event: ${error.message}`),
			);
		}
	});

	ws.on("error", (error) => {
		console.error(chalk.red(`WebSocket error: ${error.message}`));
	});

	ws.on("close", () => {
		console.log(chalk.yellow("WebSocket connection closed"));
	});
}

// Start monitoring
monitorNewTokens();
