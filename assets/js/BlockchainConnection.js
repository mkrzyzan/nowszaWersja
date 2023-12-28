document.getElementById('blockchainConnectBtn').addEventListener('click', connectButtonFn);
document.addEventListener('DOMContentLoaded', showAddress);

function showAddress() {
    const storedAddress = sessionStorage.getItem('address');
    if (storedAddress) {
        document.getElementById('blockchainConnectBtn').innerHTML = shortenAddress(storedAddress);
    } else {
        document.getElementById('blockchainConnectBtn').innerHTML = 'Connect';
    }
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

        sessionStorage.setItem('address', address);

    } catch (error) {
        console.log(error);
        alert(error);
        sessionStorage.removeItem('address');
    }
    showAddress();
}