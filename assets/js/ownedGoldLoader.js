document.addEventListener('DOMContentLoaded', loadData);
document.addEventListener('DOMContentLoaded', loadGoldOwnerDetails);

async function loadData() {

    const q = new URLSearchParams(window.location.search);

    const currentPage = parseInt(q.get('page')) || 0;

    url = `${apiUrl}/getNftExtra?owner=${sessionStorage.getItem('address')}&page=${currentPage}`;
    const resp = await fetch(url);
    const data = await resp.json();
    // const tableData = data.nft.map(nft => `<tr><td>${nft.tokenId}</td><td>${nft.image}</td><td>${nft.desc}</td><td>${nft.desc}</td><td>${nft.desc}</td></tr>`).join('');
    // console.log(tableData);

    // const tableBody = document.getElementById('ownedNftTableBody');
    // tableBody.innerHTML = tableData;
    data.nft.forEach(element => {
        addGoldBarToRow();
    });

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
function addGoldBarToRow() {
    const goldBarTemplates = document.getElementsByClassName('goldBarTemplate');
    while(goldBarTemplates.length) {
        goldBarTemplates[0].remove();
    }

    const goldBar = goldBarTemplate.cloneNode(true);
    goldBar.classList.remove('placeholder-glow');
    goldBar.classList.remove('goldBarTemplate');
    goldBar.querySelector('h1').innerHTML = 'BKK';
    goldBar.querySelector('h1').classList.remove('placeholder');
    goldBar.querySelector('p').innerHTML = "MTS <br />96.00% <br /> 20.00g <br /> $4,264 <br />1.2178 ETH";
    goldBar.querySelector('p').classList.remove('placeholder');
    goldBar.querySelector('a').href = `bullionDetails.html?id=14234`

    document.getElementById('goldBarsContainer').appendChild(goldBar);
}

async function loadGoldOwnerDetails() {

    url = `${apiUrl}/getOwnerSummary?owner=${sessionStorage.getItem('address')}`;
    const resp = await fetch(url);
    const data = await resp.json();

    const listGroup = document.getElementById('goldOwnerDetails');
    const listGroupItems = listGroup.getElementsByTagName('li');
    listGroupItems[0].querySelector('span').innerHTML = `# of Gold Bullion: ${data.goldBullionsNo} pcs`;
    listGroupItems[1].querySelector('span').innerHTML = `# of Stored Locations: ${data.storedLocations} places`;
    listGroupItems[2].querySelector('span').innerHTML = `Total Gold Weight: ${data.totalGoldWeight}`;
    listGroupItems[3].querySelector('span').innerHTML = `Weighted average purity: ${data.weightedAvgPurity}`;
    listGroupItems[4].querySelector('span').innerHTML = `Total Gold Value: ${data.totalGoldValue}`;
}