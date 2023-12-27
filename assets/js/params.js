params = new URLSearchParams(window.location.search);

if (window.location.pathname.includes('bullionDetails')) {
    document.getElementById('bullionIdNumber').innerText = params.get('id')
} else if (window.location.pathname.includes('goldOwnerProfile')) {
    document.getElementById('goldOwnerName').innerText = params.get('goldOwner')
} else {
    // do nothing
}

function getUsername(address) {
    // fetch username from the avacus endpoint
    // https://apis.avacus.cc/1/secure-chat/v1/public/users/0x0459620D616C6D827603d43539519FA320B831c2
    // parse the JSON response and return the username

    return fetch(`https://apis.avacus.cc/1/secure-chat/v1/public/users/${address}`)
        .then(response => response.json())
        .then(data => {
            console.log(data)
            return data.display_name
        })
        .catch(err => console.log(err));
}