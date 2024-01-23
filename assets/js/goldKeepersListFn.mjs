document.addEventListener('DOMContentLoaded', loadData);

import { shortenAddress } from './funkcje.mjs';

async function loadData() {

    const q = new URLSearchParams(window.location.search);

    const currentPage = parseInt(q.get('page')) || 0;

    const url = `${apiUrl}/getKeepers?page=${currentPage}`;
    const resp = await fetch(url);
    const data = await resp.json();
    document.getElementById('goldKeepersTableBody').innerHTML = '';
    data.keepers.forEach(goldKeeper => {
        document.getElementById('goldKeepersTableBody').innerHTML += `
            <tr>
                <td><a href="/goldKeeperProfile.html?address=${goldKeeper.address}">${shortenAddress(goldKeeper.address)}</a></td>
                <td>${goldKeeper.blockNumber}</td>
                <td>${goldKeeper.weight.toFixed(2)}g</td>
                <td>\$${goldKeeper.priceUsd.toFixed(2)}</td>
            </tr>
        `;
    });

    if (data.keepers.length === 0) {
        document.getElementById('goldBarsContainer').innerHTML = '<p class="text-center">No gold bars found.</p>';
    } else {
        // summary data
        // const listGroup = document.getElementById('goldOwnerDetails');
        // const listGroupItems = listGroup.getElementsByTagName('li');
        // listGroupItems[0].querySelector('span').innerHTML = `# of Gold Bullion: ${data.summary.goldBullionsKeptNo} pcs`;
        // listGroupItems[1].querySelector('span').innerHTML = `# of Stored Locations: ${data.summary.location} places`;
        // listGroupItems[2].querySelector('span').innerHTML = `Total Gold Weight: ${data.summary.totalGoldWeight}g`;
        // listGroupItems[3].querySelector('span').innerHTML = `Weighted average purity: ${data.summary.weightedAvgPurity.toFixed(2)}%`;
        // listGroupItems[4].querySelector('span').innerHTML = `Total Gold Value: \$${data.summary.totalGoldValue.toFixed(2)}`;
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



