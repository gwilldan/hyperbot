import WebSocket from "ws";
import { Wallet } from "ethers";
import { signStandardL1Action } from "../utils/signing.js";
import { config } from "dotenv";
config();

// ---------------------------------------ONLY THINGS TO CHANGE
let tokenToBuy = "hpepe";
const usdcAmountToBuy = 150;
const slippage = 70;
// ---------------------------------------------------------------

const ws = new WebSocket("wss://api.hyperliquid.xyz/ws");
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const wallet = new Wallet(PRIVATE_KEY);

let reconnectInterval;
const reconnectDelay = 50;
let isBought = false;
let isDisconnected = false;

let pair;
let index;
let tokenIndex;
let tokenDecimal;
let token;
let pairName;

let interval;
let allData;
let universe;
let tokens;
let details;
let midPrice;

const connect = () => {
	ws.on("open", () => {
		console.log("Connected to the server");
		clearTimeout(reconnectInterval);

		const getAllData = JSON.stringify({
			method: "post",
			id: 1,
			request: {
				type: "info",
				payload: { type: "spotMetaAndAssetCtxs" },
			},
		});

		const getOrderBook = JSON.stringify({
			method: "subscribe",
			id: 5,
			subscription: {
				type: "l2Book",
				coin: "PURR/USDC",
			},
		});

		const ping = JSON.stringify({ method: "ping" });

		// ws.send(getOrderBook);

		interval = setInterval(() => {
			console.log(new Date());
			ws.send(getAllData);
			ws.send(ping);
			ws.send(getOrderBook);
		}, 250);
	});

	ws.on("message", async (message) => {
		const res = JSON.parse(message).data;

		console.log("response...", res?.response?.payload?.data);

		console.log(res?.levels);

		if (res?.id === 1) {
			allData = res?.response?.payload?.data;
			tokens = allData[0].tokens;
			universe = allData[0].universe;
			details = allData[1];

			token = tokens.find(
				(_token) => _token.name.toLowerCase() == tokenToBuy.toLowerCase()
			);
			tokenIndex = token?.index;
			tokenDecimal = token?.szDecimals;

			pair = universe.find(
				(_pair) =>
					_pair?.tokens[0] == tokenIndex || _pair?.tokens[1] == tokenIndex
			);

			if (!pair) {
				return console.log("PAIR NOT FOUND...", pair);
			}
			console.log("Pair Found...");
			console.log(new Date());

			pairName = pair.name;
			index = pair.index;
			midPrice = details[pairName];
			const pairInfo = details.find((_pair) => _pair.coin == pairName);
			midPrice = pairInfo.midPx;

			if (!midPrice) return console.log("No price yet...");

			clearInterval(interval);

			if (isBought) return console.log("bought already...");

			// marketBuy(midPrice);
			isBought = true;

			return;
		}

		if (res?.id === 2) {
			console.log("response...", new Date());
			console.log(res?.response?.payload?.response?.data?.statuses);
		}

		if (res?.id === 3) {
			console.log("response...", new Date());
			console.log(res?.response);
		}
	});

	ws.on("close", () => {
		console.log("Disconnected from the server");
		console.log("|||||||||||||||||||||||||||||||||||");
		console.log("|||||||||||||||||||||||||||||||||||");
		console.log("|||||||||||||||||||||||||||||||||||");
		console.log("|||||||||||||||||||||||||||||||||||");
		scheduleReconnect();
	});

	ws.on("error", (error) => {
		console.error("WebSocket error:", error);
		scheduleReconnect();
	});
};

function scheduleReconnect() {
	clearTimeout(reconnectInterval);
	reconnectInterval = setTimeout(() => {
		console.log("Attempting to reconnect...");
		connect();
	}, reconnectDelay);
}

// ---------------------------------------
//this helps to to round figures to required dp and standard figures
// ---------------------------------------
function roundFig(num, significantDigits, maxDecimalPlaces) {
	if (num === 0.0) {
		return 0.0;
	}

	const orderOfMagnitude = Math.floor(Math.log10(Math.abs(num)));
	const neededDecimalPlaces = significantDigits - orderOfMagnitude - 1;
	const actualDecimalPlaces = Math.min(
		Math.max(neededDecimalPlaces, 0),
		maxDecimalPlaces
	);
	const value = Number(num.toFixed(actualDecimalPlaces));

	return value;
}

// ---------------------------------------
//this is to market buy tokens...
// ---------------------------------------
async function marketBuy(marketPrice) {
	const asset = index + 10000;

	const timeStamp = Date.now();

	const size = usdcAmountToBuy / Number(marketPrice);
	const slippageAllowance = (Number(marketPrice) * slippage) / 100;
	const priceWithSlippage = Number(marketPrice) + slippageAllowance;

	// required to round up to dp as directed by the docs
	const dp = 8 - tokenDecimal;
	const rounded_priceWithSlippage = roundFig(
		priceWithSlippage,
		5,
		dp
	).toString();
	const rounded_size = roundFig(size, 5, tokenDecimal).toString();

	const action = {
		type: "order",
		orders: [
			{
				a: asset,
				b: true,
				p: rounded_priceWithSlippage,
				s: rounded_size,
				r: false,
				t: {
					limit: {
						tif: "Ioc",
					},
				},
			},
		],
		grouping: "na",
	};

	const signature = await signStandardL1Action(action, wallet, null, timeStamp);

	const obj = JSON.stringify({
		method: "post",
		id: 2,
		request: {
			type: "action",
			payload: {
				action: action,
				nonce: timeStamp,
				signature: signature,
			},
		},
	});
	console.log(obj);
	ws.send(obj);
	console.log("BUYING...", new Date());
}

connect();

// const start = () => {
// 	if (isDisconnected) {
// 		connect();
// 	} else {
// 		connect();
// 	}
// };
