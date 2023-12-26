document.getElementById('createNewBullionBtn').addEventListener('click', function () {
    // get the file from the form element id documentToUpload.
    var file = document.getElementById('documentToUpload').files[0];
    // get the file id from the form element id documentId.
    var id = document.getElementById('documentId').value;
  
    // check if the current site is running on localhost or on the cloud
    if (window.location.href.indexOf('localhost') > -1) {
      // if we are running on localhost, set the url to http://localhost:8788/images
      url = 'http://localhost:8788/images';
    } else {
      // if we are running on the cloud, set the url to https://nowszawersja.pages.dev/images
      url = 'https://nowszawersja.pages.dev/images';
    }

    // send POST request to the url https://nowszawersja.pages.dev/images using fetch API. Add the file data to the body of the request.
    fetch(url, {
        method: 'POST',
        body: file,
        headers:{'x-filename':id}
    })
});