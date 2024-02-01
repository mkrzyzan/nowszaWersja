export async function onRequest(context) {
    // console.log(context.request);

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Headers', '*');
    headers.set('Access-Control-Allow-Methods', '*');

    if (context.request.method === 'OPTIONS') {
        return new Response('OK', {headers});
    }

    const params = context.request.url.split('?').pop();
    const urlParams = new URLSearchParams(params);

    const requestBody = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "eth_getLogs",
        "params": [
            {
            "address": [
                urlParams.get('vaultAddress')
            ],
            "fromBlock": "earliest",
            "toBlock": "latest",
            "topics": [
                "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
            ]
            }
        ]
    }

    const options = {method: 'POST', headers: {accept: 'application/json', contentType: 'application/json'}, body: JSON.stringify(requestBody)};
    const api = context.env.ALCHEMY_TOKEN;
    const url = `https://eth-sepolia.g.alchemy.com/v2/${api}`;
    const resp = await fetch(url, options)
    const json = await resp.json();

    // processing
    const tokens = new Map();
    for (const event of json.result) {
        const tokenId = Number(event.topics[3]);
        const key = `${event.address.toLowerCase()}-${tokenId}`;
        if (event.topics[1] === "0x0000000000000000000000000000000000000000000000000000000000000000") {   
            // minting event (always first for the token)
            // process
            const mintAddress = '0x'+event.topics[2].slice(26);
            tokens.set(key, {
                address: event.address,
                tokenId: tokenId,
                mint: mintAddress, 
                blockNumber: Number(event.blockNumber),
                owner: null, 
            });
            await context.env.MINT_CACHE.put(key, mintAddress);
        } else if (event.topics[2] === "0x0000000000000000000000000000000000000000000000000000000000000000") {
            // burn event
            // process
            tokens.delete(key);
        } else {
            // transfer event
            // process
            tokens.get(key).owner = '0x'+event.topics[2].slice(26);
        }
    }

    const respStr = JSON.stringify(Array.from(tokens.values()));
    return new Response(respStr, {headers});
}
