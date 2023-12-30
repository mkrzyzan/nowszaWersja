document.getElementById('createNewBullionBtn').addEventListener('click', createNewBullionFn);

function setBusy(val) {
  if (val) {
    document.querySelector('#createNewBullionBtn').classList.add('disabled');
    document.querySelector('#createNewBullionBtn [role]').classList.remove('visually-hidden');
    document.querySelector('#createNewBullionBtn :not([role])').classList.add('visually-hidden');
  } else {
    document.querySelector('#createNewBullionBtn').classList.remove('disabled');
    document.querySelector('#createNewBullionBtn [role]').classList.add('visually-hidden');
    document.querySelector('#createNewBullionBtn :not([role])').classList.remove('visually-hidden');
  }
}

async function createNewBullionFn() {
  try {
    setBusy(true);
    // get the file from the form element id documentToUpload.
    var file = document.getElementById('documentToUpload').files[0];
    // get the file id from the form element id documentId.
    var id = document.getElementById('documentId').value;
    // get the nft text details
    var nftText = document.getElementById('bullionDetailsText').value;

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
    await fetch(url, {
        method: 'POST',
        body: file,
        headers:{'x-filename':id}
    })

    const currentAddress = sessionStorage.getItem('address');
    const prov = new window.ethers.BrowserProvider(window.ethereum);
    const signer = await prov.getSigner(currentAddress);

    const contractAddress = '0x3b7B8812ce2A40757965BE4f29127F831c95D97f';
    const abi = [
      'function safeMint(address to, uint256 tokenId, string memory data, string memory pictureUrl) public',
    ]
    const contract = new window.ethers.Contract(contractAddress, abi, signer);
    const tx = await contract.safeMint(currentAddress, id, nftText, `https://nowszawersja.pages.dev/images?file=${id}`);
    const receipt = await tx.wait();

    console.log(receipt);

  } catch (err) {
    alert(err);
  } finally {
    setBusy(false);
  }
}