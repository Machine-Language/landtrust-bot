import * as sorter from "./sorter.mjs";
import * as myfs from "./myfs.mjs";
import * as mailer from "./mailer.mjs";

function main() {
  myfs.download("todays-list.json")
    .then(() => { return myfs.readLists() })
    .then((data) => { return sorter.sort(data[0], data[1]) })
    .then((data) => {
      if (data) {
        console.log("APPLICATIONS LIST __________________________________");
        console.log(data[0]);
        console.log("STATUS LIST __________________________________");
        console.log(data[1]);
        mailer.sendEmail(data[0], data[1]);
        myfs.renameAndCopyLists();
        // Run the callback function from sorter
        // finalLog = data[2];
        // finalLog();
      }
    })
}
main();

