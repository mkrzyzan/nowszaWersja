params = new URLSearchParams(window.location.search);

if (window.location.pathname.includes('bullionDetails')) {
    document.getElementById('bullionIdNumber').innerText = params.get('id')
} else if (window.location.pathname.includes('goldOwnerProfile')) {
    document.getElementById('goldOwnerName').innerText = params.get('goldOwner')
} else {
    // do nothing
}

switch (window.location.hostname) {
    case 'localhost':
    case '127.0.0.1':
      var apiUrl = 'http://localhost:8788';
      break;
    default:
      var apiUrl = 'https://nowszawersja.pages.dev';
      break;
}