// call the config method that will read our environmental variables file and save them
require('dotenv').config();
const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const imageToBase64 = require('image-to-base64');

let unsortedFiles = [];
let filesToUpload = [];

//* ************************************************** //
//* *************** Helper Functions ***************** //
//* ************************************************** //
function compareFileNames(f1, f2) {
  let name1 = f1.split('.')[0];
  let name2 = f2.split('.')[0];
  return name1 === name2;
}

//* ************************************************** //
//* ****** Data Staging and Upload Functions ********* //
//* ************************************************** //
// A Promise represents a value which may be available now, or in the future, or never.
// In order to create a new promise we need to instantiate a new promise object
// Now since this takes a callback add the resolve and reject to it
const getFiles = () => {
  return new Promise((resolve, reject) => {
    fs.readdir('./racecars/', (err, files) => {
      if (err) {
        reject(err);
      }
      files.forEach((file) => {
        unsortedFiles.push(file);
      });
      resolve(true);
    });
  });
}

// Loops through the "unsortedFiles" array and compares the file names
// If there is a match they get put inside their own array
const modifyFilesForUpload = async () => {
  for (let index = 0; index < unsortedFiles.length; ++index) {
    const element1 = unsortedFiles[index];
    const element2 = unsortedFiles[index + 1];
    if (index + 1 === unsortedFiles.length) {
      return;
    }
    if (compareFileNames(element1, element2)) {
      await imageToBase64('./racecars/' + element2) // path to the image
        .then((response) => {
          filesToUpload.push({
            fileReference: element2.split('.')[0],
            meta: fs.readFileSync('./racecars/' + element1, {
              encoding: 'utf8',
              flag: 'r'
            }),
            img: response,
          });
        })
        .catch((error) => {
          console.log(chalk.yellow.bold(`Error in imageToBase64 ${error} .............`));
        });
    }
  }
}

async function uploadMyNFT(metadata, assetNumber, base64ImageData) {
  const body = {
    AssetName: assetNumber,
    previewImageNft: {
      mimetype: 'image/png',
      fileFromBase64: base64ImageData,
      metadataPlaceHolder: [
        {
          name: 'car',
          value: metadata.car,
        },
        {
          name: 'background',
          value: metadata.background,
        },
        {
          name: 'helmet',
          value: metadata.helmet,
        },
        {
          name: 'driverName',
          value: metadata.driverName,
        },
        {
          name: 'sexuality',
          value: metadata.sexuality,
        },
        {
          name: 'topSpeed',
          value: metadata.topSpeed,
        },
      ],
    },
  };

  const data = JSON.stringify(body);


  const config = {
    method: 'post',
    url: `https://api.nft-maker.io/UploadNft/${process.env.API_KEY}/${process.env.PROJECT_ID}`,
    headers: {
      accept: 'text/plain',
      'Content-Type': 'application/json'
    },
    data: data,
  };

  await axios(config)
    .then(function (response) {
      console.log(chalk.blueBright.bgBlackBright.bold(`🚀 Success ${assetNumber} has been uploaded`));
    })
    .catch(function (error) {
      console.log(chalk.yellow.bold(`Whoops!!! ${error} ............... 🖕🏿`));
    });
}


//* ************************************************** //
//* ***************** Run the script ***************** //
//* ************************************************** //
// The purpose of a generator is to run some code and then return a value, and then run some more code and return another value
// Make an object that asynchronously generates a sequence of values
// The yield keyword causes the call to the generator's next()
// The next() method should return a promise (to be fulfilled with the next value).
async function* asyncGenerator() {
  let i = 0; // //The asset number to start on
  yield getFiles();
  yield modifyFilesForUpload();
  while (i < 5) {
    const metadata = JSON.parse(filesToUpload[i].meta);
    const assetNumber = filesToUpload[i].fileReference.padStart(5, '0');
    const base64ImageData = filesToUpload[i].img;
    yield uploadMyNFT(metadata, assetNumber, base64ImageData);
    yield i++;
  }
}


// The for await...of statement creates a loop iterating over async iterable objects
// In order to use the generator we need to run the generator function which will return a generator object that allows use to use the generator
(async function () {
  // As the generator is asynchronous, we can use await inside it,
  for await (let num of asyncGenerator()) {
    if (num === 4) {
      console.log(chalk.magentaBright.bold('Finished generating images, now Axios will upload the shit. lmao...'));
      process.exitCode = 0;
    }
  }
})();
