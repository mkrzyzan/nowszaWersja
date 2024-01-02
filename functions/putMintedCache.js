export async function onRequest(context) {
    console.log(context.request);
  
    try {

      const params = context.request.url.split('?').pop();
      const urlParams = new URLSearchParams(params);
      const key = `${urlParams.get('contract')}-${urlParams.get('tokenId')}`;
      await context.env.MINT_CACHE.put(key, urlParams.get('mint'));

      return new Response('OK', {status: 200});
  
    } catch(err) {
      console.log(err);
      throw err;
      // return new Response(err, {status: 500});
    }
  }
  