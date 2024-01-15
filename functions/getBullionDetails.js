export async function onRequest(context) {
    console.log(context.request);

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Headers', '*');
    headers.set('Access-Control-Allow-Methods', '*');

    if (context.request.method === 'OPTIONS') {
        return new Response('OK', {headers});
    }

    const descDataFromBlockChain = '1.2oz/37.2g;99.99%;MTS Premium Bullion;MTS;MTS Gold Co., Ltd.';
    const descData = descDataFromBlockChain.split(';');

    const data = {
        goldKeeper: '0x0459620d616c6d827603d43539519fa320b831c2',
        goldHolder: '0x0459620d616c6d827603d43539519fa320b831c2',
        contractAddress: '0x096BCC72C9839d021B91FE91038c72DF5D8197dE',
        image: 'http://localhost:8788/images?file=12345',
        location: 'Bangkok',
        weight: descData[0],
        purity: descData[1],
        nameSeries: descData[2],
        minter: descData[3],
        shopPurchased: descData[4],
        valueUSD: '$1,975.20',
        valueETH: '1,975.20 ETH',
        timeToDepositPayment: '2 days',
    }

    return new Response(JSON.stringify(data), {headers});
}
