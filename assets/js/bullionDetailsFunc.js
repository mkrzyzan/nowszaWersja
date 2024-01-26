document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
    const vaultMappings = await fetch(`${apiUrl}/getVaultSummary`);
    const vaultMappingsJson = await vaultMappings.json();

    const q = new URLSearchParams(window.location.search);
    const tokenId = q.get('id');
    const contractAddress = q.get('contractAddress');

    url = `${apiUrl}/getBullionDetails?tokenId=${tokenId}&contractAddress=${contractAddress}&tokenType=ERC721`;
    const resp = await fetch(url);
    const data = await resp.json();

    document.getElementById('goldKeeper').innerHTML = data.goldKeeper;
    document.getElementById('goldKeeperLink').href = `goldKeeperProfile.html?address=${data.goldKeeper}`;
    document.getElementById('goldHolder').innerHTML = data.goldHolder.toLowerCase() != data.goldKeeper.toLowerCase() ? data.goldHolder : 'Not yet sold';
    document.getElementById('contractAddress').innerHTML = data.contractAddress;
    document.getElementById('contractAddressLink').href = `https://sepolia.etherscan.io/address/${data.contractAddress}`;
    document.getElementById('image').src = data.image;
    document.getElementById('location').innerHTML = vaultMappingsJson[data.contractAddress.toLowerCase()].locationSymbol;

    document.getElementById('goldBullionDetailsParagraph').innerHTML = `
    Location: ${vaultMappingsJson[data.contractAddress.toLowerCase()].location}<br />
    Weight: ${data.weight}<br />
    Purity: ${data.purity}<br />
    Name/Series: ${data.nameSeries}<br />
    Minter: ${data.minter}<br />
    Shop Purchased: ${data.shopPurchased}<br />
    Value (USD): ${data.valueUSD.toFixed(2)}<br />
    `;

    document.getElementById('card').innerHTML = `
    ${data.minter}<br />
    ${data.purity}<br />
    ${data.weight}<br />
    \$${data.valueUSD.toFixed(2)}<br />
    `

    document.getElementById('timeToDepositPayment').innerHTML = `Next Fee Payment: ${data.timeToDepositPayment}`;
}