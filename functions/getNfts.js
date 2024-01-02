export async function onRequest(context) {
  console.log(context.request);

  try {
    const options = {method: 'GET', headers: {accept: 'application/json'}};

    const params = context.request.url.split('?').pop();
    const urlParams = new URLSearchParams(params);

    const q = new URLSearchParams();
    q.append('owner', urlParams.get('owner'));
    q.append('contractAddresses[]', '0x096BCC72C9839d021B91FE91038c72DF5D8197dE');
    q.append('withMetadata', true);
    q.append('pageSize', 5);
    q.append('pageKey', urlParams.get('pageKey'));

    const api = context.env.ALCHEMY_TOKEN;

    const url = `https://eth-sepolia.g.alchemy.com/nft/v3/${api}/getNFTsForOwner?${q}`;

    const resp = await fetch(url, options)
    const json = await resp.json();

    const respFiltered = json.ownedNfts.map(x =>
      ({name: x.name, 
        tokenId: x.tokenId,
        desc: x.description, 
        mint: x.mint.mintAddress,
        image: x.raw.metadata.image,
        contract: x.contract.address
      }));

    for (const nft of respFiltered) {
      nft.mint = await getCachedMintAddress(context, nft.contract, nft.tokenId, nft.mint);
    }
    
    const payload = {
      nft: respFiltered,
      pageKey: json.pageKey,
    }
    return new Response(JSON.stringify(payload), {status: 200});

  } catch(err) {
    console.log(err);
    // return new Response(err, {status: 500});
    throw err;
  }
}

async function getCachedMintAddress(context, contract, tokenId, alchemyCahcedMintAddress) {
  const key = `${contract}-${tokenId}`;

  if (alchemyCahcedMintAddress) {
    await context.env.MINT_CACHE.delete(key);
    return alchemyCahcedMintAddress;
  } else {
    const cached = await context.env.MINT_CACHE.get(key);
    return cached;
  }
}
