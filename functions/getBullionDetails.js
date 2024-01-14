export async function onRequest(context) {
    console.log(context.request);

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Headers', '*');
    headers.set('Access-Control-Allow-Methods', '*');

    if (context.request.method === 'OPTIONS') {
        return new Response('OK', {headers});
    }

    const data = {
        goldKeeper: '0x0459620d616c6d827603d43539519fa320b831c2',
        goldHolder: '0x0459620d616c6d827603d43539519fa320b831c2',
        contractAddress: '0x096BCC72C9839d021B91FE91038c72DF5D8197dE',
        image: 'images?file=4324',
        location: 'Bangkok',
        weight: '1.2oz/37.2g',
        purity: '99.99%',
        nameSeries: 'MTS Premium Bullion',
        minter: 'MTS',
        shopPurchased: 'MTS Gold Co., Ltd.',
        valueUSD: '$1,975.20',
        valueETH: '1,975.20 ETH',
        timeToDepositPayment: '2 days',
    }

    return new Response(JSON.stringify(data), {headers});
}
