export async function onRequest(context) {
    // console.log(context.request);

    const headers = new Headers({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
        'Cache-Control': 'max-age=60',
    });

    if (context.request.method === 'OPTIONS') {
        return new Response('OK', {headers});
    }

    const params = new URLSearchParams(context.request.url.split('?').pop());
    const api = context.env.ALCHEMY_TOKEN;
    const url = `https://eth-sepolia.g.alchemy.com/nft/v3/${api}/getNFTMetadata?${params}`;
    const resp = await fetch(url)
    const json = await resp.json();
    
    // pick only the fields we need
    const respData = {
        name: json.name, 
        tokenId: json.tokenId,  
        desc: json.description, 
        image: json.raw.metadata.image,
        contract: json.contract.address
    };

    // const descDataFromBlockChain = '1.2oz/37.2g;99.99%;MTS Premium Bullion;MTS;MTS Gold Co., Ltd.';
    const descDataFromBlockChain = respData.desc;
    const descData = descDataFromBlockChain.split(';');

    const url2 = `https://eth-sepolia.g.alchemy.com/nft/v3/${api}/getOwnersForNFT?${params}`;
    const resp2 = await fetch(url2)
    const json2 = await resp2.json();

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

    // get NFT fees data from our contract
    const feesRequest = {
        "id": 1,
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [
            {
            "to": "0xED193981c07b538E9f79c5f6dD527c36CfB330ed",
            "data": "0xebdac090" + BigInt(respData.tokenId).toString(16).padStart(64, '0')
            }
        ]
    };
    const feesOptions = {method: 'POST', headers: {accept: 'application/json', contentType: 'application/json'}, body: JSON.stringify(feesRequest)};
    const feesUrl = `https://eth-sepolia.g.alchemy.com/v2/${api}`;
    const feesResp = await fetch(feesUrl, feesOptions);
    const feesJson = await feesResp.json();
    // console.log(feesJson);
    const fees = '0x' + feesJson.result.slice(2).slice(64*1, 64*(1+1));
    const dueDate = '0x' + feesJson.result.slice(2).slice(64*3, 64*(1+3));
    // console.log(fees, dueDate);

    
    const key = `${respData.contract.toLowerCase()}-${respData.tokenId}`;
    const mintAddress = await context.env.MINT_CACHE.get(key);

    const data = {
        goldKeeper: mintAddress,
        goldHolder: json2.owners[0],
        contractAddress: params.get('contractAddress'),
        image: respData.image,
        weight: descData[0],
        purity: descData[1],
        nameSeries: descData[2],
        minter: descData[3],
        shopPurchased: descData[4],
        valueUSD: parseFloat(descData[0]) * (parseFloat(descData[1])/100) * xauUsdPrice * 0.035274,
        timeToDepositPayment: dueDate,
        fees: fees,
    }

    return new Response(JSON.stringify(data), {headers});
}
