export async function onRequest(context) {

    const headers = new Headers({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
        'Cache-Control': 'max-age=3600',
    });

    if (context.request.method === 'OPTIONS') {
        return new Response('OK', {headers});
    }

    const data = {
        '0xED193981c07b538E9f79c5f6dD527c36CfB330ed': {
            location: 'Bangkok',
            locationSymbol: 'BKK'
        },
        '0x58a67411665ba2831ca946058f948c1b0d732cad': {
            location: 'Singapore',
            locationSymbol: 'SGP'
        },
        '0x58a67411665ba2831ca946058f948c1b0d732cae': {
            location: 'Hong Kong',
            locationSymbol: 'HKG'
        },
    }

    return Response.json(data, {headers});
}
