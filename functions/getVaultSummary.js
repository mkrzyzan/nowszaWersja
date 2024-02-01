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
        '0xed193981c07b538e9f79c5f6dd527c36cfb330ed': {
            location: 'Bangkok',
            locationSymbol: 'BKKv2'
        },
        '0x58a67411665ba2831ca946058f948c1b0d732cac': {
            location: 'Bangkok (old)',
            locationSymbol: 'BKKv1'
        },
    }

    return Response.json(data, {headers});
}
