document.getElementById('createNewBullionBtn').addEventListener('click', function () {
    // get the file from the form element id documentToUpload.
    var file = document.getElementById('documentToUpload').files[0];
    // get the file id from the form element id documentId.
    var id = document.getElementById('documentId').value;
  
    switch (window.location.hostname) {
      case 'localhost':
      case '127.0.0.1':
        url = 'http://localhost:8788/images';
        break;
      default:
        url = 'https://nowszawersja.pages.dev/images';
        break;
    }

    // send POST request to the url https://nowszawersja.pages.dev/images using fetch API. Add the file data to the body of the request.
    fetch(url, {
        method: 'POST',
        body: file,
        headers:{'x-filename':id}
    })
});