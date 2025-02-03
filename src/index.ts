import { PUMP_PORTAL_WS_URL } from "./config";
import { storeData } from "./utils";
import WebSocket from "ws";
import chalk from "chalk";
import path from "path";

const dataPath = path.join(__dirname, "data", "new_coins.json");
let ws = null;
let shouldReconnect = true;
let isShuttingDown = false;

// Function to handle WebSocket connection
function connectWebSocket() {
	ws = new WebSocket(PUMP_PORTAL_WS_URL);

	ws.on("open", () => {
		console.log(chalk.green("Connected to PumpPortal WebSocket!"));
		ws.send(JSON.stringify({ method: "subscribeNewToken" }));
	});

	ws.on("message", (data) => {
		try {
			const message = JSON.parse(data.toString());
			console.log(chalk.bgGreen(`Received new token event:`), message);

			// Create token data object
			const tokenData = {
				timestamp: new Date().toISOString(),
				mintAddress: message.mint,
				tokenInfo: message,
			};

			// Store token data
			storeData(dataPath, tokenData)
				.then(() => {
					console.log(
						chalk.green(`Token data stored successfully for ${message.mint}`),
					);
				})
				.catch((error) => {
					console.error(
						chalk.red(
							`Failed to store token data for ${message.mint}: ${error.message}`,
						),
					);
				});
		} catch (error) {
			console.error(
				chalk.red(`Error processing token event: ${error.message}`),
			);
			console.error(chalk.yellow(`Failed message data:`), data.toString());
		}
	});

	ws.on("error", (error) => {
		console.error(chalk.red(`WebSocket error: ${error.message}`));
		if (shouldReconnect) {
			setTimeout(() => connectWebSocket(), 5000);
		}
	});

	ws.on("close", () => {
		// Do not log anything here
	});
}

// Initialize WebSocket connection with retry logic
function initializeWebSocket() {
	shouldReconnect = true;
	connectWebSocket();
}

// Graceful shutdown handler
function shutdown() {
	if (isShuttingDown) return;
	isShuttingDown = true;

	shouldReconnect = false;
	if (ws) {
		ws.close();
	}
	console.log(chalk.yellow("Shutting down gracefully..."));
}

// Handle process signals
process.on("SIGINT", () => {
	shutdown();
});

process.on("SIGTERM", () => {
	shutdown();
});

// Start the bot
initializeWebSocket();
