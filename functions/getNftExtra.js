export async function onRequest(context) {
    console.log(context);

    const headers = new Headers({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
    });

    if (context.request.method === 'OPTIONS') {
      return new Response('OK', {headers});
    }

    const params = context.request.url.split('?').pop();
    const urlParams = new URLSearchParams(params);

    // get all the tokens
    const origin = new URL(context.request.url).origin;
    const tokens = await fetch(`${origin}/getAllHistory`, {method: 'GET', headers: {accept: 'application/json'}});
    const tokensJson = await tokens.json();

    // filter history here
    let filtered = tokensJson;
    if (urlParams.has('owner')) {
        filtered = filtered.filter(x => x.owner === urlParams.get('owner'));
    }
    if (urlParams.has('mint')) {
        filtered = filtered.filter(x => x.mint === urlParams.get('mint'));
    }
    const numberOfPages = Math.ceil(filtered.length / 5);
    // console.log(filtered);


    // if there are no tokens, return empty response
    if (filtered.length === 0) {
        const payload = {
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
    
    // pick only the fields we need
    const respFiltered = json.nfts.map(x =>({
        name: x.name, 
        tokenId: x.tokenId,  
        desc: x.description, 
        image: x.raw.metadata.image,
        contract: x.contract.address
    }));

    // enrich the response with data from the history
    const extraData = new Map(filtered.map(x => [`${x.address}-${x.tokenId}`.toLowerCase(), {mint:x.mint, owner:x.owner}]));
    const enriched = respFiltered.map(x => ({
        ...x, 
        fromLogs: extraData.get(`${x.contract}-${x.tokenId}`.toLowerCase()),
    }));

    // summary
    const summary = {
        totalGoldValue: 'USD 1,975.20',
        storageType: 'Safe Deposit Box',
        location: 'Bangkok',
        since: '2021-01-01',
        goldBullionsKeptNo: enriched.length,
    };
    enriched.forEach(x => {
        const dets = x.desc.split(';');
        const weight = parseFloat(dets[0]) || 0;
        const purity = weight != 0 ? (parseFloat(dets[1])/weight || 0) : 0;
        summary.totalGoldWeight = summary.totalGoldWeight ? summary.totalGoldWeight + weight : weight;
        summary.weightedAvgPurity = summary.weightedAvgPurity ? summary.weightedAvgPurity + purity : purity;
    });

    // pagination
    const page = urlParams.get('page');
    const enrichedPaginated = enriched.slice(page*5, page*5+5);

    const payload = {
        summary,
        nft: enrichedPaginated,
        pages: numberOfPages
    }

    return new Response(JSON.stringify(payload), {headers});
}
