import { Wallet } from "ethers";
import { getMarketPrice } from "../utils/getSpotData.js";
import { signStandardL1Action } from "../utils/signing.js";
import { config } from "dotenv";
config();

// ------------------------------------------------------------   WHICH TOKEN WOULD YOU LIKE TO MARKET BUY ----
// make sure to chanage the ticker...
const tokenTicker = "six";
const usdcToBuy = 15; //make sure it's in number...
const slippage = 10; //make sure it's in numbers too
// ---------------------------------------------------------------------------------------------------------

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const wallet = new Wallet(PRIVATE_KEY);
const exchange_URL = `${process.env.URL}/exchange`;

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

const marketBuy = async () => {
	const { marketPrice, pair, tokenDecimal } = await getMarketPrice(tokenTicker);
	const pairIndex = pair?.index;
	const asset = 10000 + pairIndex;
	const timeStamp = Date.now();

	const size = usdcToBuy / Number(marketPrice);
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

	const payload = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			action: action,
			nonce: timeStamp,
			signature: signature,
		}),
	};

	console.log(payload);

	try {
		console.log("buying...");
		const res = await fetch(exchange_URL, payload);
		if (!res.ok) throw res.statusText;
		const data = await res.json();
		console.log(data.response.data);
	} catch (error) {
		console.error("THIS IS THE ERROR!......", error);
	}
};

marketBuy();
