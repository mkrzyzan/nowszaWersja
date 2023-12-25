params = new URLSearchParams(window.location.search);

switch (window.location.pathname) {
    case '/bullionDetails.html':
        document.getElementById('bullionIdNumber').innerText = params.get('id')
        break;
    case '/goldOwnerProfile.html':
        document.getElementById('goldOwnerName').innerText = params.get('goldOwner')
        break;
    default:
        break;
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