export async function onRequest(context) {
    // console.log(context.request);

    const headers = new Headers({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
    });

    if (context.request.method === 'OPTIONS') {
        return new Response('OK', {headers});
    }
  
    // if the method is POST, we're uploading a file
    if (context.request.method === 'POST') {
        const fileName = context.request.headers.get('x-filename');
        console.log(fileName);
        await context.env.MY_BUCKET.put(fileName, context.request.body, {httpMetadata: context.request.headers});
        return new Response('OK', {headers});
    } else if (context.request.method === 'GET') {
        // if the method is GET, we're fetching a file
        const pars = new URLSearchParams(context.request.url.split('?').pop());
        const fileName = pars.get('file');
        const fileData = await context.env.MY_BUCKET.get(fileName);
        // const headers = new Headers();
        fileData.writeHttpMetadata(headers);
        headers.set('etag', fileData.httpEtag)
        return new Response(fileData.body, {headers});
    } else {
        return new Response('Method not allowed', {status: 405});
    }
  }