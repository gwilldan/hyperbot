import { Wallet } from "ethers";
import { getOpenOrders, getListedPair } from "../utils/getSpotData.js";
import { signStandardL1Action } from "../utils/signing.js";
import { config } from "dotenv";
config();

// ------------------------------------------------------------   WHICH ORDER WOULD YOU LIKE TO CANCEL ----
// make sure to chanage the ticker...
const tokenTicker = "VAPOR";
// ---------------------------------------------------------------------------------------------------------

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const wallet = new Wallet(PRIVATE_KEY);
const exchange_URL = `${process.env.URL}/exchange`;

const cancelOrder = async (ticker) => {
	console.log("Preparing to cancel Order ...");

	const openOrders = await getOpenOrders(wallet);
	const { pair } = await getListedPair(ticker);

	if (!openOrders.length) return console.log("NO OPEN ORDER...");

	const targetOrder = openOrders.find(
		(_order) => _order.coin == pair.name || _order.coin == pair.index
	);

	if (!targetOrder.length) return console.log("ORDER NOT FOUND!...");

	// directive from docs
	const asset = 10000 + pair.index;

	console.log("Target opened order found");
	console.log(targetOrder);

	const action = {
		type: "cancel",
		cancels: [
			{
				a: asset,

				o: targetOrder[0].oid,
			},
		],
	};

	const timeStamp = Date.now();

	try {
		const signature = await signStandardL1Action(
			action,
			wallet,
			null,
			timeStamp
		);

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
		const res = await fetch(exchange_URL, payload);
		if (!res.ok) throw res.statusText;
		const data = await res.json();
		console.log(data.response.data.statuses);
	} catch (error) {
		console.error("THIS IS THE ERROR");
		console.error(error);
	}
};

cancelOrder(tokenTicker);
