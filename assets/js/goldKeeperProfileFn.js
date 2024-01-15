document.addEventListener('DOMContentLoaded', goldKeeperSummary);
document.addEventListener('DOMContentLoaded', goldKeeperAssets);

async function goldKeeperSummary() {
    const q = new URLSearchParams(window.location.search);
    const goldKeeperAddress = q.get('address');

    url = `${apiUrl}/getGoldKeeperSummary?address=${goldKeeperAddress}`;
    const resp = await fetch(url);
    const data = await resp.json();

    document.getElementById('goldKeeperAddress').innerHTML = goldKeeperAddress;
    document.getElementById('goldKeeperDetails').innerHTML = 
    `Location: ${data.location}<br />
    Keeping gold since: ${data.since}<br />
    #no of gold bullions kept: ${data.goldBullionsKeptNo}<br />
    storage type: ${data.storageType}<br />
    total gold weight: ${data.totalGoldWeight}<br />
    total gold value: ${data.totalGoldValue}<br />
    `;
}

async function goldKeeperAssets() {
    const q = new URLSearchParams(window.location.search);
    const goldKeeperAddress = q.get('address').toLowerCase();

    const url = `${apiUrl}/getNftExtra?mint=${goldKeeperAddress}`;
    const resp = await fetch(url);
    const data = await resp.json();

    data.nft.forEach(element => {
        addGoldBarToRow();
    });
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