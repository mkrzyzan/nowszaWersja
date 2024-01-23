export function kula () {
    console.log('I am here!');
}

export function shortenAddress(address) {
    // short the address to 0x1234...5678
    return address.slice(0, 6) + '...' + address.slice(-4);
}