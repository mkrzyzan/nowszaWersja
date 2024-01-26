document.addEventListener('DOMContentLoaded', loadNulls);
document.addEventListener('DOMContentLoaded', loadNotNulls);

let vaultMappingsJson = {};

async function loadNotNulls() {
    await loadData(false, 'goldBarsMintedSold', 'goldBarsMintedSoldPagination');
}
async function loadNulls() {
    await loadData(true, 'goldBarsMinted', 'goldBarsMintedPagination');
}

async function loadData(isNull, containerId, paginationId) {

    const vaultMappings = await fetch(`${apiUrl}/getVaultSummary`);
    vaultMappingsJson = await vaultMappings.json();

    const q = new URLSearchParams(window.location.search);

    const currentPage = parseInt(q.get(containerId + 'page')) || 0;

    const url = `${apiUrl}/getNftExtra?isOwnerNull=${isNull}&page=${currentPage}`;
    const resp = await fetch(url);
    const data = await resp.json();
    data.nft.forEach(bar => {
        const goldBar = addGoldBarToRow(bar);
        document.getElementById(containerId).appendChild(goldBar);
    });

    const nextPage = currentPage + 1;
    const prevPage = currentPage - 1;
    const pagItem = document.getElementById(paginationId);
    const nextPageParams = new URLSearchParams(q);
    const prevPageParams = new URLSearchParams(q);
    nextPageParams.set(`${containerId}page`, nextPage);
    prevPageParams.set(`${containerId}page`, prevPage);
    
    pagItem.querySelector('.pagination a[aria-label=Next]').href = `?${nextPageParams.toString()}`;
    pagItem.querySelector('.pagination a[aria-label=Previous]').href = `?${prevPageParams.toString()}`;
    if (prevPage < 0) {
        pagItem.querySelector('.pagination a[aria-label=Previous]').classList.add('disabled');
    }
    if (nextPage >= data.pages) {
        pagItem.querySelector('.pagination a[aria-label=Next]').classList.add('disabled');
    }
    pagItem.querySelector('.pagination a:not([aria-label])').innerHTML = `${currentPage + 1} / ${data.pages}`;
}

const goldBarTemplate = document.getElementsByClassName('goldBarTemplate')[0];
function addGoldBarToRow(bar) {
    const goldBarTemplates = document.getElementsByClassName('goldBarTemplate');
    while(goldBarTemplates.length) {
        goldBarTemplates[0].remove();
    }

    const details = bar.desc.split(';');

    const goldBar = goldBarTemplate.cloneNode(true);
    goldBar.classList.remove('placeholder-glow');
    goldBar.classList.remove('goldBarTemplate');
    goldBar.querySelector('h2').innerHTML = vaultMappingsJson[bar.contract.toLowerCase()].locationSymbol;
    goldBar.querySelector('h2').classList.remove('placeholder');
    goldBar.querySelector('p').innerHTML = `${details[3]} <br />${details[0]} <br /> ${details[1]} <br /> \$${bar.priceUsd.toFixed(2)}`;
    goldBar.querySelector('p').classList.remove('placeholder');
    goldBar.querySelector('a').href = `/bullionDetails.html?id=${bar.tokenId}&contractAddress=${bar.contract}`

    return goldBar;
}

