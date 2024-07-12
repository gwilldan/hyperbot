import { config } from "dotenv";
config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const tokenName = "RAGE";

const info_URL = "https://api.hyperliquid.xyz/info";
const exchange_URL = "https://api.hyperliquid.xyz/exchange";

const getSpotPairs = async () => {
	console.log("Checking Spot Pairs ...");

	const obj = {
		method: "POST",
		headers: {
			"content-Type": "application/json",
		},
		body: JSON.stringify({ type: "spotMetaAndAssetCtxs" }),
	};

	try {
		const res = await fetch(info_URL, obj);
		const data = await res.json();
		console.log(data[1]);
	} catch (error) {
		console.error(error);
	}

	// setInterval(async () => {
	// 	try {
	// 		const res = await fetch(info_URL, obj);
	// 		const data = await res.json();
	// 		const tokens = data.tokens;
	// 		const universe = data.universe;
	// 		console.log(tokens);
	// 		console.log(universe);
	// 		const Listed = tokens.filter(
	// 			(token) => token.name.toLowerCase() == tokenName.toLowerCase()
	// 		);
	// 		console.log(Listed, Listed.length);
	// 	} catch (error) {
	// 		console.error("THIS IS THE ERROR");
	// 		console.error(error);
	// 	}
	// }, 1000);
};

const cancelOrder = async () => {
	console.log("Preparing to cancel Order ...");

	const obj = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			action: {
				type: "cancel",
				cancels: [
					{
						a: 34,

						o: 34,
					},
				],
			},
			nonce: Date.now(),
			signature: "",
		}),
	};

	try {
		const res = await fetch(exchange_URL, obj);
		const data = await res.json();
		console.log(data);
	} catch (error) {
		console.error("THIS IS THE ERROR");
		console.error(error);
	}
};

const checkUserSpot = async () => {
	const url = "https://api.hyperliquid.xyz/info";
	console.log("Checking user data...");

	const obj = {
		method: "POST",
		headers: {
			"content-Type": "application/json",
		},
		body: JSON.stringify({
			type: "spotClearinghouseState",
			user: walletAddress,
		}),
	};

	try {
		const res = await fetch(url, obj);
		const data = await res.json();

		console.log(data);
	} catch (error) {
		console.error("THIS IS THE ERROR");
		console.error(error);
	}
};

const testSigning = async () => {};

// getSpotPairs();
// checkContract();
// cancelOrder();
// checkUserSpot();
