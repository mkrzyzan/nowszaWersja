document.addEventListener('DOMContentLoaded', goldKeeperAssets);
let vaultMappingsJson = {};

async function goldKeeperAssets() {
    const vaultMappings = await fetch(`${apiUrl}/getVaultSummary`);
    vaultMappingsJson = await vaultMappings.json();

    const q = new URLSearchParams(window.location.search);
    const goldKeeperAddress = q.get('address').toLowerCase();

    const currentPage = parseInt(q.get('page')) || 0;

    const url = `${apiUrl}/getNftExtra?mint=${goldKeeperAddress}&page=${currentPage}`;
    const resp = await fetch(url);
    const data = await resp.json();

    data.nft.forEach(bar => {
        addGoldBarToRow(bar);
    });

    document.getElementById('goldKeeperAddress').innerHTML = shortenAddress(goldKeeperAddress);
    document.getElementById('goldKeeperAddressLink').href = `https://avacus.cc/profile/${goldKeeperAddress}`;
    document.getElementById('goldKeeperDetails').innerHTML = 
    `Location: ${data.summary.location}<br />
    Keeping gold since: ${data.summary.since}<br />
    #no of gold bullions kept: ${data.summary.goldBullionsKeptNo}<br />
    storage type: ${data.summary.storageType}<br />
    total gold weight: ${data.summary.totalGoldWeight.toFixed(2)}g<br />
    total gold avg. purity: ${data.summary.weightedAvgPurity.toFixed(2)}%<br />
    total gold value: \$${data.summary.totalGoldValue.toFixed(2)}<br />
    `;

    const nextPage = currentPage + 1;
    const prevPage = currentPage - 1;
    document.querySelector('.pagination a[aria-label=Next]').href = `?page=${nextPage}&address=${goldKeeperAddress}`;
    document.querySelector('.pagination a[aria-label=Previous]').href = `?page=${prevPage}&address=${goldKeeperAddress}`;
    if (prevPage < 0) {
        document.querySelector('.pagination a[aria-label=Previous]').classList.add('disabled');
    }
    if (nextPage >= data.pages) {
        document.querySelector('.pagination a[aria-label=Next]').classList.add('disabled');
    }
    document.querySelector('.pagination a:not([aria-label])').innerHTML = `${currentPage + 1} / ${data.pages}`;

}


const goldBarTemplate = document.getElementsByClassName('goldBarTemplate')[0];
function addGoldBarToRow(bar) {
    const goldBarTemplates = document.getElementsByClassName('goldBarTemplate');
    while(goldBarTemplates.length) {
        goldBarTemplates[0].remove();
    }

    const details = bar.desc.split(';');
    console.log(bar);

    const goldBar = goldBarTemplate.cloneNode(true);
    goldBar.classList.remove('placeholder-glow');
    goldBar.classList.remove('goldBarTemplate');
    goldBar.querySelector('h2').innerHTML = vaultMappingsJson[bar.contract.toLowerCase()].locationSymbol;
    goldBar.querySelector('h2').classList.remove('placeholder');
    goldBar.querySelector('p').innerHTML = `${details[3]} <br />${details[0]} <br /> ${details[1]} <br /> \$${bar.priceUsd.toFixed(2)}`;
    goldBar.querySelector('p').classList.remove('placeholder');
    goldBar.querySelector('a').href = `/bullionDetails.html?id=${bar.tokenId}&contractAddress=${bar.contract}`

    document.getElementById('goldBarsContainer').appendChild(goldBar);
}

function shortenAddress(address) {
    // short the address to 0x1234...5678
    return address.slice(0, 6) + '...' + address.slice(-4);
}