document.addEventListener('DOMContentLoaded', loadData);
document.querySelector('.pagination a[aria-label=Next]').addEventListener('click', nextPage);
document.querySelector('.pagination a[aria-label=Previous]').addEventListener('click', prevPage);

async function loadData() {

    const q = new URLSearchParams(window.location.search);

    switch (window.location.hostname) {
        case 'localhost':
        case '127.0.0.1':
          url = 'http://localhost:8788';
          break;
        default:
          url = 'https://nowszawersja.pages.dev';
          break;
      }

    const pages = JSON.parse(sessionStorage.getItem('pages') || '[]');
    const currentPage = pages[pages.length - 1];

    url = `${url}/getNfts?owner=0x0459620D616C6D827603d43539519FA320B831c2&pageKey=${currentPage}`;
    const resp = await fetch(url);
    const data = await resp.json();
    const tableData = data.nft.map(nft => `<tr><td>${nft.tokenId}</td><td>${nft.image}</td><td>${nft.desc}</td><td>${nft.desc}</td><td>${nft.desc}</td></tr>`).join('');
    console.log(tableData);

    const tableBody = document.getElementById('ownedNftTableBody');
    tableBody.innerHTML = tableData;

    sessionStorage.setItem('nextPageKey', data.pageKey);
}

async function nextPage() {
    const pages = JSON.parse(sessionStorage.getItem('pages') || '[]');
    pages.push(sessionStorage.getItem('nextPageKey'));
    sessionStorage.setItem('pages', JSON.stringify(pages));
    await loadData();
}

async function prevPage() {
    const pages = JSON.parse(sessionStorage.getItem('pages') || '[]');
    sessionStorage.setItem('nextPageKey', pages.pop());
    sessionStorage.setItem('pages', JSON.stringify(pages));
    await loadData();
}