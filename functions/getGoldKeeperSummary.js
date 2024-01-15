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

    const data = {
        location: 'Bangkok',
        since: '2021-01-01',
        storageType: 'Safe Deposit Box',
        goldBullionsKeptNo: 5,
        totalGoldWeight: '4.59oz/89.3g',
        weightedAvgPurity: '99.99%',
        totalGoldValue: '$7,876.00',
    }

    return new Response(JSON.stringify(data), {headers});
}
