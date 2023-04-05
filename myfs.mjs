import fs from "fs";
import https from "https";
import { mailError } from "./mailer.mjs";
import moment from "moment";

const date =
  moment().format("D") + moment().format("MMM") + moment().format("YYYY");

const url =
  "https://ckan0.cf.opendata.inter.prod-toronto.ca/dataset/0aa7e480-9b48-4919-98e0-6af7615b7809/resource/043f9e44-ed62-4b4e-96d8-bdfcea27ec91/download/Development%20Applications%20Data.json";
export function download(fileName) {
  return new Promise((resolve, reject) => {
    const require = https.get(url, (res) => {
      console.log("downloading...");
      const fileStream = fs.createWriteStream(`./data/${fileName}`);
      res.pipe(fileStream);

      fileStream.on("error", (err) => {
        reject(new Error("someting done goofed"));
        console.log("error downloading to filestream");
        console.error(err);
        mailError(err);
        //Send an email to note of the error
      });

      fileStream.on("finish", () => {
        fileStream.close();
        fs.readFile('./data/yesterdays-list.json', 'utf8', (err, data) => {
          if (err) {
            console.error(err);
            return;
          }
          resolve(data);

        });
      });
    });
    require.on("error", (err) => {
      console.log("error downloading file");
      console.error(err);
      mailError(err);
    });
  });
}

function readDownloadList() {
  return new Promise((resolve, reject) => {
    fs.readFile('./data/todays-list.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        reject();
        return;
      }
      let dataParsed = JSON.parse(data)
      resolve(dataParsed)
    });
  })
}

function readYesterdaysList() {
  return new Promise((resolve, reject) => {
    fs.readFile('./data/yesterdays-list.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err);
        reject();
        return;
      }
      let dataParsed = JSON.parse(data)
      resolve(dataParsed)
    });
  })
}

// Read JSON files into memory
export function readLists() {
  return Promise.all([readDownloadList(), readYesterdaysList()]);
}

export function renameAndCopyLists() {
  fs.renameSync("./data/yesterdays-list.json", `./history/${date}.json`);
  fs.copyFileSync("./data/todays-list.json", "./data/yesterdays-list.json");
}
