import { config } from "dotenv";
config();

const info_URL = `${process.env.URL}/info`;

// ---------------------------------------
//this gives token and maket datas
// ---------------------------------------
export const getSpotData = async () => {
	const payload = {
		method: "POST",
		headers: {
			"content-Type": "application/json",
		},
		body: JSON.stringify({ type: "spotMetaAndAssetCtxs" }),
	};

	try {
		const res = await fetch(info_URL, payload);
		const data = await res.json();
		const universe = data[0].universe;
		const tokens = data[0].tokens;
		const details = data[1];

		return {
			universe: universe,
			tokens: tokens,
			details: details,
		};
	} catch (error) {
		console.error(error);
	}
};

// ---------------------------------------
// this helps to get token index and decimal
// ---------------------------------------
export const getTokenData = async (ticker = "") => {
	const { tokens } = await getSpotData();

	if (tokens) {
		const token = tokens.find(
			(_token) => _token.name.toLowerCase() == ticker.toLowerCase()
		);

		if (!token)
			return {
				tokenIndex: undefined,
				tokenDecimal: undefined,
			};

		return {
			tokenIndex: token.index,
			tokenDecimal: token.szDecimals,
			tokenName: token.name,
		};
	}
};

// ---------------------------------------
// helps to get open orders of a particular wallet
// ---------------------------------------
export const getOpenOrders = async (wallet) => {
	const payload = {
		method: "POST",
		headers: {
			"content-Type": "application/json",
		},
		body: JSON.stringify({
			type: "openOrders",
			user: wallet.address,
		}),
	};

	try {
		const res = await fetch(info_URL, payload);
		const data = await res.json();
		return data;
	} catch (error) {
		console.error(error);
	}
};

// ---------------------------------------
//this helps to get listed pairs
// ---------------------------------------
export const getListedPair = async (_ticker) => {
	try {
		const { universe } = await getSpotData();
		const { tokenIndex, tokenDecimal } = await getTokenData(_ticker);

		if (!tokenIndex || !universe)
			return {
				tokenIndex: undefined,
				pair: undefined,
				tokenDecimal: tokenDecimal,
			};

		const pair = universe.find(
			(_pair) => _pair.tokens[0] == tokenIndex || _pair.tokens[1] == tokenIndex
		);

		if (pair) {
			return {
				tokenIndex: tokenIndex,
				pair: pair,
				tokenDecimal: tokenDecimal,
			};
		} else {
			return {
				tokenIndex: undefined,
				pair: undefined,
				tokenDecimal: tokenDecimal,
			};
		}
	} catch (error) {
		console.error(error);
	}
};

// ---------------------------------------
//get marketPrice of a specific token
// ---------------------------------------
export const getMarketPrice = async (_ticker) => {
	const { pair, tokenDecimal } = await getListedPair(_ticker);
	const pairName = pair && pair.name;

	try {
		const obj = {
			method: "POST",
			headers: {
				"content-Type": "application/json",
			},
			body: JSON.stringify({
				type: "allMids",
			}),
		};

		const res = await fetch(info_URL, obj);
		const data = await res.json();

		if (!data || !pairName)
			return {
				marketPrice: undefined,
				pair: undefined,
				tokenDecimal: tokenDecimal,
			};

		const marketPrice = data[pairName];

		return {
			marketPrice: marketPrice,
			pair: pair,
			tokenDecimal: tokenDecimal,
		};
	} catch (error) {
		console.error(error);
	}
};
