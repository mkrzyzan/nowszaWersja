document.getElementById('blockchainConnectBtn').addEventListener('click', () => {
    localStorage.setItem('walletConnected', true)
    connectButtonFn();
});
connectButtonFn();

async function connectButtonFn() {
    try {
        if (localStorage.getItem('walletConnected') == 'true') {

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
            // console.log('wallet already connected');
        }
    } catch (error) {
        console.log(error);
        localStorage.setItem('walletConnected', false);
        document.getElementById('blockchainConnectBtn').innerHTML = 'Connect';
    }
}