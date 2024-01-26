export async function onRequest(context) {
    // console.log(context);

    const headers = new Headers({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
        'Cache-Control': 'max-age=60',
    });

    if (context.request.method === 'OPTIONS') {
      return new Response('OK', {headers});
    }

    const params = context.request.url.split('?').pop();
    const urlParams = new URLSearchParams(params);

    // get all the tokens (with history)
    const hist = await context.env.MINT_CACHE.get('history');
    let cachedHistory = JSON.parse(hist || '{"timestamp":0}')
    if (cachedHistory.timestamp + 10*60*1000 < Date.now()) {
        const origin = new URL(context.request.url).origin;
        const tokens = await fetch(`${origin}/getAllHistory`, {method: 'GET', headers: {accept: 'application/json'}});
        const tokensJson = await tokens.json();
        const historyToCache = {timestamp: Date.now(), tokensJson};
        await context.env.MINT_CACHE.put('history', JSON.stringify(historyToCache));
        cachedHistory = historyToCache;
    }

    // filter history here
    let filtered = cachedHistory.tokensJson;
    if (urlParams.has('owner')) {
        filtered = filtered.filter(x => x.owner === urlParams.get('owner'));
    }
    if (urlParams.has('isOwnerNull')) {
        if (urlParams.get('isOwnerNull') === 'true') {
            filtered = filtered.filter(x => x.owner === null);
        } else {
            filtered = filtered.filter(x => x.owner !== null);
        }
    }
    if (urlParams.has('mint')) {
        filtered = filtered.filter(x => x.mint === urlParams.get('mint'));
    }
    const numberOfPages = Math.ceil(filtered.length / 6);
    // console.log(filtered);


    // if there are no tokens, return empty response
    if (filtered.length === 0) {
        const payload = {
            summary: {goldBullionsKeptNo: 0},
            nft: [],
            pages: numberOfPages
        }
        return new Response(JSON.stringify(payload), {headers});
    }

    // get the metadata for the tokens (max 100! Is prior pagination needed? - yes)
    const requestBody = { tokens: filtered.map(x => ({contractAddress: x.address, tokenId: x.tokenId, tokenType: 'ERC721'})) };
    const options = {method: 'POST', headers: {accept: 'application/json', contentType: 'application/json'}, body: JSON.stringify(requestBody)};
    const api = context.env.ALCHEMY_TOKEN;
    const url = `https://eth-sepolia.g.alchemy.com/nft/v3/${api}/getNFTMetadataBatch`;
    const resp = await fetch(url, options)
    const json = await resp.json();

    // get XAU/USD price
    const xauUsdPriceRequest = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [
          {
            "to": "0x214eD9Da11D2fbe465a6fc601a91E62EbEc1a0D6",
            "data": "0x50d25bcd"
          }
        ]
    };
    const xauUsdPriceOptions = {method: 'POST', headers: {accept: 'application/json', contentType: 'application/json'}, body: JSON.stringify(xauUsdPriceRequest)};
    const xauUsdPriceUrl = `https://eth-mainnet.g.alchemy.com/v2/CwkfRZV0ZNQotCF7eWavhtZYuDmA_KN5`;
    const xauUsdPriceResp = await fetch(xauUsdPriceUrl, xauUsdPriceOptions);
    const xauUsdPriceJson = await xauUsdPriceResp.json();
    const xauUsdPrice = parseInt(xauUsdPriceJson.result) / 1e8;
    // console.log(xauUsdPrice);
    
    // pick only the fields we need
    const respFiltered = json.nfts.map(x =>({
        name: x.name, 
        tokenId: x.tokenId,  
        desc: x.description, 
        image: x.raw.metadata.image,
        contract: x.contract.address,
        weight: parseFloat(x.description.split(';')[0]),
        priceUsd: parseFloat(x.description.split(';')[0]) * (parseFloat(x.description.split(';')[1])/100) * xauUsdPrice * 0.035274
    }));

    // enrich the response with data from the history
    const extraData = new Map(filtered.map(x => [`${x.address}-${x.tokenId}`.toLowerCase(), {mint:x.mint, owner:x.owner}]));
    const enriched = respFiltered.map(x => ({
        ...x, 
        fromLogs: extraData.get(`${x.contract}-${x.tokenId}`.toLowerCase()),
    }));

    // summary
    const summary = {
        storageType: 'Safe Deposit Box',
        location: 'Bangkok',
        since: '2021-01-01',
        goldBullionsKeptNo: enriched.length,
    };
    enriched.forEach(x => {
        const dets = x.desc.split(';');
        const weight = parseFloat(dets[0]) || 0;
        const purity = parseFloat(dets[1]) || 0;
        const valUSD = weight * xauUsdPrice * 0.035274;
        summary.totalGoldValue = summary.totalGoldValue ? summary.totalGoldValue + valUSD : valUSD;
        summary.totalGoldWeight = summary.totalGoldWeight ? summary.totalGoldWeight + weight : weight;
        summary.weightedAvgPurity = summary.weightedAvgPurity ? summary.weightedAvgPurity + purity*weight : purity*weight;
    });
    summary.weightedAvgPurity = summary.weightedAvgPurity / summary.totalGoldWeight;

    // pagination
    const page = urlParams.get('page');
    const enrichedPaginated = enriched.slice(page*6, page*6+6);

    const payload = {
        summary,
        nft: enrichedPaginated,
        pages: numberOfPages
    }

    return new Response(JSON.stringify(payload), {headers});
}
