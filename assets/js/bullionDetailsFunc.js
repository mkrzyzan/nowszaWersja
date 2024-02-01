document.addEventListener('DOMContentLoaded', initialize);
document.getElementById('setFeesBtn').addEventListener('click', setFees);
document.getElementById('payFeesBtn').addEventListener('click', payFees);
document.getElementById('collectFeeBtn').addEventListener('click', collect);

async function initialize() {
    const vaultMappings = await fetch(`${apiUrl}/getVaultSummary`);
    const vaultMappingsJson = await vaultMappings.json();

    const q = new URLSearchParams(window.location.search);
    const tokenId = q.get('id');
    const contractAddress = q.get('contractAddress');

    url = `${apiUrl}/getBullionDetails?tokenId=${tokenId}&contractAddress=${contractAddress}&tokenType=ERC721`;
    const resp = await fetch(url);
    const data = await resp.json();

    const notSold = data.goldHolder.toLowerCase() != data.goldKeeper.toLowerCase();
    document.getElementById('goldKeeper').innerHTML = data.goldKeeper;
    document.getElementById('goldKeeperLink').href = `goldKeeperProfile.html?address=${data.goldKeeper}`;
    document.getElementById('goldHolder').innerHTML = notSold ? data.goldHolder : 'Contact Gold Keeper to Purchase';
    document.getElementById('goldHolderLink').href = `https://avacus.cc/profile/${data.goldHolder}`;
    document.getElementById('contractAddress').innerHTML = data.contractAddress;
    document.getElementById('contractAddressLink').href = `https://sepolia.etherscan.io/address/${data.contractAddress}`;
    document.getElementById('image').src = data.image;
    document.getElementById('location').innerHTML = vaultMappingsJson[data.contractAddress.toLowerCase()].locationSymbol;

    const dueDate = new Date(1000 * Number(BigInt(data.timeToDepositPayment)));
    document.getElementById('goldBullionDetailsParagraph').innerHTML = `
    Location: ${vaultMappingsJson[data.contractAddress.toLowerCase()].location}<br />
    Weight: ${data.weight}<br />
    Purity: ${data.purity}<br />
    Name/Series: ${data.nameSeries}<br />
    Minter: ${data.minter}<br />
    Shop Purchased: ${data.shopPurchased}<br />
    Value (USD): ${data.valueUSD.toFixed(2)}<br />
    Next Fee Payment: ${dueDate.toLocaleDateString()} - ${dueDate.toLocaleTimeString()}<br />
    Fee: ${BigInt(data.fees)}<br />
    `;

    document.getElementById('card').innerHTML = `
    ${data.minter}<br />
    ${data.purity}<br />
    ${data.weight}<br />
    \$${data.valueUSD.toFixed(2)}<br />
    `

    // emable button if goldkeeper is the user
    if (data.goldKeeper.toLowerCase() == sessionStorage.getItem('address')) {
        if (data.state == 2) {
            document.getElementById('setFeeBtnToggler').classList.remove('disabled');
        }
        if (data.state == 1) {
            document.getElementById('collectFeeBtn').classList.remove('disabled');
        }
    }

    if ((data.goldHolder||'').toLowerCase() == sessionStorage.getItem('address')) {
        if (data.state == 0) {
            document.getElementById('payFeeBtnToggler').classList.remove('disabled');
        }
    }


}

async function setFees() {
    try {
        document.getElementById('spinnerSet').classList.remove('visually-hidden');
        document.getElementById('setFeesBtn').classList.add('disabled');
        const q = new URLSearchParams(window.location.search);

        const tokenId = q.get('id');
        const contractAddress = q.get('contractAddress');
        const fee = document.getElementById('feesToSet').value;
        const dueDate = document.getElementById('feesToSetDueTo').value;

        console.log(tokenId, contractAddress, fee, dueDate);

        const provider = new window.ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        const abi = [
            'function setDespositFees(uint256 tokenId, uint256 fee, uint256 dueDateSec) public'
        ];

        const contract = new window.ethers.Contract(contractAddress, abi, signer);
        const tx = await contract.setDespositFees(tokenId, fee, dueDate);
        const receipt = await tx.wait();
        console.log(receipt);
        console.log('finish!');
    } finally {
        document.getElementById('spinnerSet').classList.add('visually-hidden');
        document.getElementById('setFeesBtn').classList.remove('disabled');

        // hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('setFeesMod'));
        modal.hide();
    }
}

async function payFees() {
    try {
        document.getElementById('spinnerPay').classList.remove('visually-hidden');
        document.getElementById('payFeesBtn').classList.add('disabled');
        const q = new URLSearchParams(window.location.search);

        const tokenId = q.get('id');
        const contractAddress = q.get('contractAddress');
        const fee = document.getElementById('payFeesValue').value;

        console.log(fee, tokenId, contractAddress);

        const provider = new window.ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        const abi = [
            'function payDepositFees(uint256 tokenId) public payable'
        ];

        const contract = new window.ethers.Contract(contractAddress, abi, signer);
        const tx = await contract.payDepositFees(tokenId, { value: fee });
        const receipt = await tx.wait();
        console.log(receipt);
        console.log('finish!');
    } finally {
        document.getElementById('spinnerPay').classList.add('visually-hidden');
        document.getElementById('payFeesBtn').classList.remove('disabled');

        // hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('payFeesMod'));
        modal.hide();
    }
}

async function collect() {
    try {
        document.getElementById('spinnerCollect').classList.remove('visually-hidden');
        document.getElementById('collectFeeBtn').classList.add('disabled');
        const q = new URLSearchParams(window.location.search);

        const tokenId = q.get('id');
        const contractAddress = q.get('contractAddress');

        console.log(tokenId, contractAddress);

        const provider = new window.ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        const abi = [
            'function collectDepositFees(uint256 tokenId) public'
        ];

        const contract = new window.ethers.Contract(contractAddress, abi, signer);
        const tx = await contract.collectDepositFees(tokenId);
        const receipt = await tx.wait();
        console.log(receipt);
        console.log('finish!');
    } finally {
        document.getElementById('spinnerCollect').classList.add('visually-hidden');
        document.getElementById('collectFeeBtn').classList.remove('disabled');
    }
}