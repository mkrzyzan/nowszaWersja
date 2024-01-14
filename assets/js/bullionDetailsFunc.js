document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
    const q = new URLSearchParams(window.location.search);
    const tokenId = q.get('id');
    const contractAddress = q.get('contractAddress');

    // const pages = JSON.parse(sessionStorage.getItem('pages') || '[]');
    // const currentPage = pages[pages.length - 1];

    url = `${apiUrl}/getBullionDetails?id=${tokenId}&contractAddress=${contractAddress}`;
    const resp = await fetch(url);
    const data = await resp.json();

    document.getElementById('goldKeeper').innerHTML = data.goldKeeper;
    document.getElementById('goldKeeperLink').href = `goldKeeperProfile.html?address=${data.goldKeeper}`;
    document.getElementById('goldHolder').innerHTML = data.goldHolder;
    document.getElementById('contractAddress').innerHTML = data.contractAddress;
    document.getElementById('image').src = data.image;
    document.getElementById('location').innerHTML = data.location;
    document.getElementById('weight').innerHTML = data.weight;
    document.getElementById('purity').innerHTML = data.purity;
    document.getElementById('nameSeries').innerHTML = data.nameSeries;
    document.getElementById('minter').innerHTML = data.minter;
    document.getElementById('shopPurchased').innerHTML = data.shopPurchased;
    document.getElementById('valueUSD').innerHTML = data.valueUSD;
    document.getElementById('valueETH').innerHTML = data.valueETH;
    document.getElementById('timeToDepositPayment').innerHTML = data.timeToDepositPayment;
}