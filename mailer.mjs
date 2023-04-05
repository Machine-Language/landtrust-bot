import nodemailer from "nodemailer";
import emailList from "./data/mail-recipients.json" assert {type: "json"};
import password from "./data/password.json" assert {type: "json"};

export async function
  mail(applicationList, statusList) {

  let emailBody = `<b> **EXAMPLE** Hello this is the landtrust bot. I have found useful information from Toronto's Development Applications List!<BR><BR> <U><h2>NEW LISTINGS</B></h2></U>`;

  applicationList.forEach(item => {
    emailBody +=
      `<h6 align="right" > NEW-LISTING </h6>
<ul>
<li><B>DESCRIPTION</B> : ${item.DESCRIPTION}</li>
 <li><B>STATUS</B> : ${item.STATUS}</li>
 <li><B>STREET_NAME</B>: ${item.STREET_NAME} </li>
 <li><B>STREET_NUM</B> : ${item.STREET_NUM} </li>
 <li><B>STREET_TYPE</B> : ${item.STREET_TYPE} </li>
 <li><B>POSTAL</B> : ${item.POSTAL} </li>
 <li><B>APPLICATION NUMBER</B> : ${item.APPLICATION_NUMBER} </li>
 <li><B>APPLICATION TYPE</B> : ${item.APPLICATION_TYPE}
 <li><B>ID</B> : ${item._id} </li>
 <li><B>REFERENCE_FILE_NUMBER</B> : ${item.REFERENCE_FILE_NUMBER}</li>
 <li><B>HEARING_DATE</B> : ${item.HEARING_DATE} </li>
 <li><B>DATE_SUBMITTED</B> : ${item.DATE_SUBMITTED}</li> <BR><BR><hr><BR><BR>
</ul>`
  })

  emailBody += "<BR><BR> <B><U><h2>NEW STATUS CHANGES</B></h2></U>";

  statusList.forEach(item => {
    emailBody +=
      ` <h6 align="right" > NEW-STATUS-UPDATE</h6>
                <ul>
                <li><B>STATUS</B> : ${item.STATUS}</li>               
                <li><B>DESCRIPTION</B> : ${item.DESCRIPTION}</li>
                 <li><B>STREET_NAME</B>: ${item.STREET_NAME} </li>
                 <li><B>STREET_NUM</B> : ${item.STREET_NUM} </li>
                 <li><B>STREET_TYPE</B> : ${item.STREET_TYPE} </li>
                 <li><B>POSTAL</B> : ${item.POSTAL} </li>
                 <li><B>APPLICATION NUMBER</B> : ${item.APPLICATION_NUMBER} </li>
                 <li><B>APPLICATION TYPE</B> : ${item.APPLICATION_TYPE}
                 <li><B>ID</B> : ${item._id} </li>
                 <li><B>REFERENCE_FILE_NUMBER</B> : ${item.REFERENCE_FILE_NUMBER}</li>
                 <li><B>HEARING_DATE</B> : ${item.HEARING_DATE} </li>
                 <li><B>DATE_SUBMITTED</B> : ${item.DATE_SUBMITTED}</li> <BR><BR><hr><BR><BR>
                </ul>`
  })

  //Create email list from the json
  let mailRecipients = "";
  for (let item of emailList) {
    mailRecipients += item.EMAIL + ",";

  }
  console.log(mailRecipients)

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "landtrust.bot@gmail.com",
      pass: password[0].password,
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"LANDTRUST BOT " <landtrust.bot@gmail.com>',
    to: mailRecipients, // list of receivers
    subject: "I have found useful information ✔",
    text: "", // plain text body
    html: emailBody, // html body
  });

  console.log("Message sent: %s", info.messageId);

  return 'nodemailer: "I have emailed."';
}

export async function
  mailError(err) {

  const myError = JSON.stringify(err, Object.getOwnPropertyNames(err))


  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "landtrust.bot@gmail.com",
      pass: password[0].password,
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"LANDTRUST BOT " <landtrust.bot@gmail.com>', // sender address
    to: "draigan.lefebvre@gmail.com, landtrust.bot@gmail.com", // list of receivers
    subject: "There was an error emailing", // Subject line
    text: myError, // plain text body
    html: "", // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>


  return 'nodemailer: "I have encountered an error and emailed it"';
}

export function sendEmail(applicationList, statusList) {
  if (statusList.length != 0 || applicationList.length != 0) {
    console.log("Emailing...");


    mail(applicationList, statusList)
      .catch((err) => {
        mailError(err);
        console.log(err);
      })
      .catch((err) => {
        mailError(err);
        console.log(err);
      });
  } else {
    console.log("There are no new entries to email");
  }
}



