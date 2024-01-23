export async function onRequest(context) {
    // console.log(context.request);

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Headers', '*');
    headers.set('Access-Control-Allow-Methods', '*');

    if (context.request.method === 'OPTIONS') {
        return new Response('OK', {headers});
    }

    const data = {
        goldBullionsNo: 5,
        storedLocations: 4,
        totalGoldWeight: '4.59oz/89.3g',
        weightedAvgPurity: '99.99%',
        totalGoldValue: '$7,876.00',
    }

    return new Response(JSON.stringify(data), {headers});
}
