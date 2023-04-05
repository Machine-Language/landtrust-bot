import fetch from "node-fetch";
import fs from "fs";
import * as d3 from "d3-geo";
import geoWard from "./data/geoward4.json" assert { type: "json" };

export function sort(data1, data2) {

  const todaysList = data1;
  const yesterdaysList = data2;

  let pastItems = fs.readFileSync('./past-items.json', 'utf8');
  pastItems = JSON.parse(pastItems);

  const todaysTotalNewEntries = todaysList.length - yesterdaysList.length;
  const newEntries = todaysList.slice(-todaysTotalNewEntries);

  let updateEntryCount = 0;

  console.log("todays list size:", todaysList.length);
  console.log("yesterdays list size:", yesterdaysList.length);
  console.log("Total new entries for today:", todaysTotalNewEntries);

  if (todaysTotalNewEntries == 0) return console.log("There is no work to be done today");

  return new Promise((res) => {

    const postalCode = ["M6K", "M6H", "M6P", "M6R", "M6J", "M5X", "M5J", "M5K", "M6L", "M3C", "M5H"];

    const failedRequests = [];
    const newApplicationList = cleanUpList(newEntries);

    // Filter by postal code and map neater version of the object
    function cleanUpList(list) {
      return list.filter((item) => {
        for (let code of postalCode) {
          if (code == item.POSTAL) {
            return true;
          }
        }

        return false;
      })
        .map((item) => {
          return {
            APPLICATION_NUMBER: item.APPLICATION_NUMBER,
            DESCRIPTION: item.DESCRIPTION,
            ID: item._id,
            POSTAL: item.POSTAL,
            STATUS: item.STATUS,
            APPLICATION_TYPE: item.APPLICATION_TYPE,
            DATE_SUBMITTED: item.DATE_SUBMITTED,

            REFERENCE_FILE_NUMBER: item.REFERENCE_FILE_NUMBER,
            HEARING_DATE: item.HEARING_DATE,

            STREET_NAME: item.STREET_NAME,
            STREET_NUM: item.STREET_NUM,
            STREET_TYPE: item.STREET_TYPEd,
            LON: null,
            LAT: null,
            COORDINATES: [],
          };
        });
    }

    function finalLog() {
      console.log(updateEntryCount, "new entries added to the past entries list");
    }

    function statusChanges(sortedList) {
      let matches = [];
      let statusDifferences = [];
      for (let i = 0; i < pastItems.length; i++) {
        for (let j = sortedList.length - 1; j > 0; j--) {
          if (pastItems[i].APPLICATION_NUMBER == sortedList[j].APPLICATION_NUMBER) {
            if (pastItems[i].STATUS != sortedList[j].STATUS) {
              statusDifferences.push(sortedList[j]);
            }
            matches.push(sortedList[j]);
            console.log("There is a new entry that is on past entries list. Updating past entries item with new item");
            pastItems[i] = sortedList[j];
            updateEntryCount++;
            j = -1;
          }

        }
      }
      sortedList.forEach((sortedItem) => {
        if (!pastItems.find((pastItem) => sortedItem.APPLICATION_NUMBER == pastItem.APPLICATION_NUMBER)) {
          pastItems.push(sortedItem);
          console.log("Added an item that wasn't on the list.")
        }
      })
      fs.writeFileSync("past-items.json", JSON.stringify(pastItems));
      return matches;

    }

    const httpRequest = (url, index) => {
      return new Promise((resolve, reject) => {
        fetch(url)
          .then((response) => response.json())
          .then((json) => {
            //Adding lon and lat to my list item
            if (json[0] != undefined) {
              newApplicationList[index].LON = json[0].lon;
              newApplicationList[index].LAT = json[0].lat;
              newApplicationList[index].COORDINATES.push(
                json[0].lon,
                json[0].lat
              );
              console.log(`SUCCESS ${newApplicationList.length - index} APPLICATION_NUMBER:${newApplicationList[index].APPLICATION_NUMBER} `);
            } else {
              console.log("An API request for coordinates failed. Probably from unknown address format ");
              console.log(newApplicationList[index]);
              newApplicationList[index].Note = "May or may not be in ward4"
              failedRequests.push(newApplicationList[index]);
            }

            resolve();
          })
          .catch(reject);
      });
    };

    // Certain address are double addresses and the api doesnt recognize them. So we have to cut those 1 to be a single address. 
    // This function will either return the cut address or the regular address if it doesnt need to be cut.
    function changeAddressToFit(address) {
      // The ones that are messing up the API have a - in them 
      if (address.includes("-")) {
        return address.slice(0, address.indexOf("-"));

      } else {
        return address;
      }
    }

    // Running loop to call httpRequest function.  
    console.log(`\nTHERE ARE ${newApplicationList.length} TOTAL API REQUESTS FOR COORDINATES\n`);
    const promiseArray = [];
    for (let i = 0; i < newApplicationList.length; i++) {
      //  How the API Should look: https://nominatim.openstreetmap.org/search?q=789+DON MILLS+toronto&format=json
      let url = `https://nominatim.openstreetmap.org/search?q=${changeAddressToFit(newApplicationList[i].STREET_NUM)}+
      ${newApplicationList[i].STREET_NAME}+toronto&format=json`;
      // Pushing to array for Promise.all and calling httpRequest with unique url.
      setTimeout(() => {
        promiseArray.push(httpRequest(url, i));
      }, 1000 * i);
    }

    setTimeout(() => {
      Promise.all(promiseArray).then(() => {
        const sortedList = newApplicationList.filter((item) => {
          return d3.geoContains(geoWard, item.COORDINATES)
        });


        // Stamps of approval...
        sortedList.forEach((item) => {
          item.WITHIN_NORTH_WARD = d3.geoContains(geoWard, item.COORDINATES);
          item.SORTED_ITEM = true;
        });

        if (failedRequests.length > 0) {

          console.log("FAILED REQUESTS!!!!!", failedRequests);
        }
        res([sortedList, statusChanges(sortedList), finalLog]);
      });
    }, newApplicationList.length * 1001);
  });
}

