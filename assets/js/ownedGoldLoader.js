document.addEventListener('DOMContentLoaded', loadData);
// document.querySelector('.pagination a[aria-label=Next]').addEventListener('click', nextPage);
// document.querySelector('.pagination a[aria-label=Previous]').addEventListener('click', prevPage);

async function loadData() {

    const q = new URLSearchParams(window.location.search);

    // sessionStorage.setItem('nextPageKey', data.pageKey);
    const currentPage = parseInt(q.get('page')) || 0;


    switch (window.location.hostname) {
        case 'localhost':
        case '127.0.0.1':
          url = 'http://localhost:8788';
          break;
        default:
          url = 'https://nowszawersja.pages.dev';
          break;
      }

    // const pages = JSON.parse(sessionStorage.getItem('pages') || '[]');
    // const currentPage = pages[pages.length - 1];

    url = `${url}/getNftExtra?owner=${sessionStorage.getItem('address')}&page=${currentPage}`;
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

    document.getElementById('goldBarsContainer').appendChild(goldBar);
}

async function nextPage() {
    // const pages = JSON.parse(sessionStorage.getItem('pages') || '[]');
    // pages.push(sessionStorage.getItem('nextPageKey'));
    // sessionStorage.setItem('pages', JSON.stringify(pages));
    await loadData();
}

async function prevPage() {
    // const pages = JSON.parse(sessionStorage.getItem('pages') || '[]');
    // sessionStorage.setItem('nextPageKey', pages.pop());
    // sessionStorage.setItem('pages', JSON.stringify(pages));
    await loadData();
}