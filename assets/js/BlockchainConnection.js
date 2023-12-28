document.getElementById('blockchainConnectBtn').addEventListener('click', () => {
    localStorage.setItem('walletConnected', true)
    connectButtonFn();
});
connectButtonFn();

async function connectButtonFn() {
    try {
        console.log('connectButtonFn');
        if (localStorage.getItem('walletConnected') == 'true') {
            alert('wallet connected');

            const storedAddress = localStorage.getItem('address');
            if (storedAddress) {
                document.getElementById('blockchainConnectBtn').innerHTML = storedAddress;
            }

            const provider = new window.ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            // short the address to 0x1234...5678
            const shortAddress = address.slice(0, 6) + '...' + address.slice(-4);

            localStorage.setItem('address', shortAddress);

            // save the provider and signer to the window object
            window.provider = provider;
            window.signer = signer;

            // throw error here
            // throw new Error('No address found');
          
            // add the address to the clicked button
            document.getElementById('blockchainConnectBtn').innerHTML = shortAddress;

        } else {
            console.log('wallet not connected');
            alert('wllet not connected');
        }
    } catch (error) {
        console.log(error);
        alert("Error: " + error);
        localStorage.setItem('walletConnected', false);
        document.getElementById('blockchainConnectBtn').innerHTML = 'Connect';
    }
}