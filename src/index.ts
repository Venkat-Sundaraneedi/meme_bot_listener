import { PUMP_PORTAL_WS_URL } from "./config";
import { storeData } from "./utils";
import WebSocket from "ws";
import chalk from "chalk";
import path from "path";

const dataPath = path.join(__dirname, "data", "new_coins.json");
let ws = null;
let shouldReconnect = true;
let isShuttingDown = false;

// Helper function to format pump token data
function formatPumpTokenData(tokenInfo) {
	return `
    ${chalk.underline.bold(" 🎉 New Token Alert! 🎉 ")}
    ===============================================
    ${chalk.green.bold("Mint Signature:")} ${chalk.cyan(tokenInfo.signature)}
    ${chalk.green.bold("Trader Public Key:")} ${chalk.cyan(tokenInfo.traderPublicKey)}
    ${chalk.green.bold("Tx Type:")} ${chalk.cyan(tokenInfo.txType)}
    ${chalk.green.bold("Mint Address:")} ${chalk.cyan(tokenInfo.mint)}
    ${chalk.green.bold("Symbol:")} ${chalk.magenta(tokenInfo.symbol)}
    ${chalk.green.bold("Name:")} ${chalk.yellow(tokenInfo.name)}
    ===============================================
    ${chalk.blue.bold("Additional Details:")}
    ${chalk.gray("• Initial Buy:")} ${chalk.green(tokenInfo.initialBuy)}
    ${chalk.gray("• SOL Amount:")} ${chalk.green(tokenInfo.solAmount)}
    ${chalk.gray("• Market Cap SOL:")} ${chalk.green(tokenInfo.marketCapSol)}
    ${chalk.yellow("Pool:")} ${chalk.cyan(tokenInfo.pool)}
    ===============================================
    ${chalk.blue.bold("Bonding Curve Detais:")}
    ${chalk.gray("• Bonding Curve Key")} ${chalk.green(tokenInfo.bondingCurveKey)}
    ${chalk.gray("• V Tokens In Bonding Curve")} ${chalk.green(tokenInfo.vTokensInBondingCurve)}
    ${chalk.gray("• V SOL In Bonding Curve")} ${chalk.green(tokenInfo.vSolInBondingCurve)}
    ===============================================
    ${chalk.yellow.bold("URI:")} ${chalk.blue.underline(tokenInfo.uri)}
  `;
}

// Helper function to format Raydium token data
function formatRaydiumTokenData(tokenInfo) {
	return `
    ${chalk.underline.bold(" 🌟 New Raydium Token Alert! 🌟 ")}
    ===============================================
    ${chalk.green.bold("Mint Signature:")} ${chalk.cyan(tokenInfo.signature)}
    ${chalk.green.bold("Mint Address:")} ${chalk.cyan(tokenInfo.mint)}
    ${chalk.green.bold("Tx Type:")} ${chalk.magenta(tokenInfo.txType)}
    ${chalk.green.bold("Market ID")} ${chalk.yellow(tokenInfo.marketId)}
    ===============================================
    ${chalk.blue.bold("Additional Details:")}
    ${chalk.gray("• Price:")} ${chalk.green(tokenInfo.price)}
    ${chalk.gray("• Market Cap SOL:")} ${chalk.green(tokenInfo.marketCapSol)}
    ${chalk.gray("• Pool:")} ${chalk.cyan(tokenInfo.pool)}
    ===============================================
  `;
}

// Function to handle WebSocket connection
function connectWebSocket() {
	ws = new WebSocket(PUMP_PORTAL_WS_URL);

	ws.on("open", () => {
		console.log(chalk.green("✅ Connected to PumpPortal WebSocket!"));
		//ws.send(JSON.stringify({ method: "subscribeNewToken" }));
		ws.send(JSON.stringify({ method: "subscribeRaydiumLiquidity" }));
	});

	ws.on("message", (data) => {
		try {
			const message = JSON.parse(data.toString());

			if (message.pool === "pump") {
				const formattedData = formatPumpTokenData(message);
				console.log(chalk.bgGreen(" 🎉 New Pump Token Detected! 🎉 "));
				console.log(formattedData);
			} else if (message.pool === "raydium") {
				const formattedData = formatRaydiumTokenData(message);
				console.log(chalk.bgMagenta(" 🌟 New Raydium Token Detected! 🌟 "));
				console.log(formattedData);
			}

			// Create token data object
			const tokenData = {
				timestamp: new Date().toISOString(),
				tokenInfo: message,
			};

			// Store token data
			storeData(dataPath, tokenData)
				.then(() => {
					//console.log(
					//	chalk.green(
					//		" √ Token data stored successfully for ",
					//		chalk.cyan(message.mint),
					//	),
					//);
				})
				.catch((error) => {
					console.error(
						chalk.red(
							" × Failed to store token data for ",
							chalk.cyan(message.mint),
						),
					);
					console.error(chalk.yellow(" Error: "), error.message);
				});
		} catch (error) {
			console.error(chalk.red(" × Error processing token event:"));
			console.error(chalk.yellow(" Error details:"), error.message);
			console.error(chalk.yellow(" Failed message data:"), data.toString());
		}
	});

	ws.on("error", (error) => {
		console.error(chalk.red(" × WebSocket error:"));
		console.error(chalk.yellow(" Error details:"), error.message);
		if (shouldReconnect) {
			console.log(chalk.cyan(" 🔁 Trying to reconnect in 5 seconds..."));
			setTimeout(() => connectWebSocket(), 5000);
		}
	});

	ws.on("close", () => {
		if (!shouldReconnect) {
			console.log(chalk.yellow(" !  WebSocket connection closed"));
		}
	});
}

// Initialize WebSocket connection with retry logic
function initializeWebSocket() {
	shouldReconnect = true;
	console.log(chalk.cyan(" 🔌 Initializing WebSocket connection..."));
	connectWebSocket();
}

// Graceful shutdown handler
function shutdown() {
	if (isShuttingDown) return;
	isShuttingDown = true;

	shouldReconnect = false;
	if (ws) {
		console.log(chalk.yellow(" !  Closing WebSocket connection..."));
		ws.close();
	}
	console.log(chalk.green(" √ Shutdown complete!"));
	process.exit(0);
}

// Handle process signals
process.on("SIGINT", () => {
	console.log(chalk.yellow(" !  Received interrupt signal..."));
	shutdown();
});

process.on("SIGTERM", () => {
	console.log(chalk.yellow(" !  Received termination signal..."));
	shutdown();
});

// Start the bot
initializeWebSocket();
