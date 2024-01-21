document.addEventListener('DOMContentLoaded', loadData);

import { kula } from './funkcje.mjs';
kula();

async function loadData() {

    const q = new URLSearchParams(window.location.search);

    const currentPage = parseInt(q.get('page')) || 0;

    const url = `${apiUrl}/getNftExtra?owner=${sessionStorage.getItem('address')}&page=${currentPage}`;
    const resp = await fetch(url);
    const data = await resp.json();
    data.nft.forEach(bar => {
        addGoldBarToRow(bar);
    });

    // summary data
    const listGroup = document.getElementById('goldOwnerDetails');
    const listGroupItems = listGroup.getElementsByTagName('li');
    listGroupItems[0].querySelector('span').innerHTML = `# of Gold Bullion: ${data.summary.goldBullionsKeptNo} pcs`;
    listGroupItems[1].querySelector('span').innerHTML = `# of Stored Locations: ${data.summary.location} places`;
    listGroupItems[2].querySelector('span').innerHTML = `Total Gold Weight: ${data.summary.totalGoldWeight}g`;
    listGroupItems[3].querySelector('span').innerHTML = `Weighted average purity: ${data.summary.weightedAvgPurity.toFixed(2)}%`;
    listGroupItems[4].querySelector('span').innerHTML = `Total Gold Value: \$${data.summary.totalGoldValue.toFixed(2)}`;

    if (data.summary.goldBullionsKeptNo === 0) {
        document.getElementById('goldBarsContainer').innerHTML = '<p class="text-center">No gold bars found.</p>';
    }

    const nextPage = currentPage + 1;
    const prevPage = currentPage - 1;
    document.querySelector('.pagination a[aria-label=Next]').href = `?page=${nextPage}`;
    document.querySelector('.pagination a[aria-label=Previous]').href = `?page=${prevPage}`;
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

    const goldBar = goldBarTemplate.cloneNode(true);
    goldBar.classList.remove('placeholder-glow');
    goldBar.classList.remove('goldBarTemplate');
    goldBar.querySelector('h1').innerHTML = 'BKK';
    goldBar.querySelector('h1').classList.remove('placeholder');
    goldBar.querySelector('p').innerHTML = `${details[3]} <br />${details[0]} <br /> ${details[1]} <br /> \$${bar.priceUsd.toFixed(2)}`;
    goldBar.querySelector('p').classList.remove('placeholder');
    goldBar.querySelector('a').href = `/bullionDetails.html?id=${bar.tokenId}&contractAddress=${bar.contract}`

    document.getElementById('goldBarsContainer').appendChild(goldBar);
}

