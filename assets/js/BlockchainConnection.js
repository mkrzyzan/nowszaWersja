document.getElementById('blockchainConnectBtn').addEventListener('click', connectButtonFn);
document.addEventListener('DOMContentLoaded', showAddress);
document.getElementById('goldVaultSelector').addEventListener('change', vaultSelected);


async function showAddress() {
    const storedAddress = sessionStorage.getItem('address');
    if (storedAddress) {
        document.getElementById('blockchainConnectBtn').innerHTML = shortenAddress(storedAddress);
    } else {
        document.getElementById('blockchainConnectBtn').innerHTML = 'Connect';
    }

    const vaultMappings = await fetch(`${apiUrl}/getVaultSummary`);
    vaultMappingsJson = await vaultMappings.json();
    fillVaultOptions(vaultMappingsJson);
}

function shortenAddress(address) {
    // short the address to 0x1234...5678
    return address.slice(0, 6) + '...' + address.slice(-4);
}

async function connectButtonFn() {
    try {
        const provider = new window.ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        sessionStorage.setItem('address', address.toLowerCase());

    } catch (error) {
        console.log(error);
        alert(error);
        sessionStorage.removeItem('address');
    }
    showAddress();
    location.reload();
}

function fillVaultOptions(vaultMappingsJson) {
    const vaultSelector = document.getElementById('goldVaultSelector');
    vaultSelector.innerHTML = '';
    for (const vault in vaultMappingsJson) {
        const option = document.createElement('option');
        option.value = vault;
        option.innerHTML = `${vaultMappingsJson[vault].locationSymbol}`;
        vaultSelector.appendChild(option);
    }

    const vault = sessionStorage.getItem('vault');
    if (vault) {
        vaultSelector.value = vault;
    }
}

function vaultSelected(e) {
    const vault = e.target.value;
    sessionStorage.setItem('vault', vault);
    location.reload();
}
