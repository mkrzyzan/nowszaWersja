export async function onRequest(context) {
    console.log(context.request);

    const headers = new Headers({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
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

    const data = {
        goldKeeper: json.mint.mintAddress,
        goldHolder: json2.owners[0],
        contractAddress: params.get('contractAddress'),
        image: respData.image,
        location: 'Bangkok', // <-- in contract metadata
        weight: descData[0],
        purity: descData[1],
        nameSeries: descData[2],
        minter: descData[3],
        shopPurchased: descData[4],
        valueUSD: '$1,975.20',  // <--- oracle or other API
        valueETH: '1,975.20 ETH',
        timeToDepositPayment: '2 days',  // <--- from our contract metadata
    }

    return new Response(JSON.stringify(data), {headers});
}
