//MANAGER DASHBOARD

//MANAGER CAN EDIT, ADD AND VIEW


path = require('path')
bodyParser = require('body-parser');
var pdf = require("pdf-creator-node");
var fs = require('fs');


const router = require("express").Router();
const verify = require("./managerverify");
const Invoice = require("../../models/Invoice");
const sendMail = require("../../sampleMail");
const User = require("../../models/User");

//VALIDATION OF USER INPUTS PREREQUISITES
const Joi = require("@hapi/joi");

const invoiceSchema = Joi.object({
  invoiceNumber: Joi.string().min(3).required(),
  clientName: Joi.string().min(3).required(),
  clientAddress: Joi.string().min(3).required(),
  clientEmail: Joi.string().min(3).required(),
  clientNumber: Joi.number().min(3).required(),
  dueDate: Joi.date().required(),
  products:Joi.array().required(),
  senderEmail: Joi.string().min(2),
});

//SERVICE REQUEST API'S

//POST
router.post("/invoice", verify, async (req, res) => {
  console.log("inside invoice api initially mail of person adding req is: "+ req.body.senderEmail);
  var d = new Date();
  let month = d.getMonth()+1;
  let str = month;
  if(month<9) str= "0" + str;
  
  var createdOn =  d.getFullYear() + "-" + str + "-" +  d.getDate() ;
  let ticket = new Invoice({
    create_time: createdOn,
    invoiceNumber: req.body.invoiceNumber,
    clientName: req.body.clientName,
    clientAddress: req.body.clientAddress,
    clientEmail: req.body.clientEmail,
    clientNumber: req.body.clientNumber,
    dueDate: req.body.dueDate,
    products: req.body.products,
    senderEmail: req.body.senderEmail,
  });

  try {
    //VALIDATION OF USER INPUTS

    const { error } = await invoiceSchema.validateAsync(req.body);
    if (error){
      return res.status(400).send(error.details[0].message);
    }
    else {
      //NEW INVOICE  IS ADDED
      let currentDate = new Date();
      ticket.create_time = new Date(currentDate.toISOString());
      let arr = req.body.products;
      let total = 0;
      for(let i=0; i<arr.length; i++){
        total+= arr[i].quantity * arr[i].price;
      }
      total = (total*11)/10;
      
      ticket.totalPrice = total;
      await ticket.save();

      console.log("mail of person adding req is: "+ req.body.senderEmail);
      const senderEmail = req.body.senderEmail;

      let sampleMail = '<p>Hi, </p>'
                    +`<p>This mail is to inform you, that ${senderEmail} has created a new Invoice</p>`
                    +'<p>Regards</p>'

      const sendMail = require('../services/mailService');
            
      sendMail({
        from: process.env.EMAIL,
        to: `vishal377@gmail.com, ${req.body.clientEmail}`,
        subject: 'New Invoice Added by Employee',
        text: `Invoice Added`,
        html: `${sampleMail}`,
      })
      .then(() => {
       
        res.send("Invoice created");
      })
      .catch((err) => {
        console.log("mail sending error "+ err);
        res.status(400).send(err);
      });
    }
  }
   catch (error) {
    console.log("error in add invoice api's catch is: "+ error);
    res.status(400).send(error);
  }
});

//GET

router.get("/invoice", verify, async (req, res) => {
  try {
    const tickets = await Invoice.find().exec();
    res.status(200).send(tickets);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

//DELETE

router.delete("/invoice", verify, async (req, res) => {
  try {
    console.log("inside manager invoice delete");
    await Invoice.deleteOne({ _id: req.body._id });
    res.status(200).send({"msg": "deleted succesfully"});
  } catch (error) {
    console.log("error inside manager invoice delete",error);
    res.status(400).send(error);
  }
});


//PUT

router.put("/invoice/:id", async (req, res) => {
  try {
    const tickets = await Invoice.findById(req.params.id).exec();

    let invoiceData = req.body;
    let arr = req.body.products;
    let total = 0;
    for (let i = 0; i < arr.length; i++) {
      total += arr[i].quantity * arr[i].price;
    }
    total = (total * 11) / 10;

    invoiceData.totalPrice = total;

    tickets.set(invoiceData);
    const result = await tickets.save();

    const email = req.body.senderEmail;
      const mailData = {
        subject: "Invoice Updated by Manager",
        message: "has updated an Invoice",
        email:  email
      }
      
      const sendEmailResponse = await sendMail(mailData);
      
      if(sendEmailResponse.resMsg=== "Verification mail sent"){
        res.send(result);
      }
      else {
        console.log("mail sending error "+ sendEmailResponse.resMsg);
        res.status(400).send(sendEmailResponse.resMsg);
      }
    
  } catch (error) {
    res.status(500).send(error);
  }
});



//USERS
router.get("/users", verify, async (req, res) => {
  try {
    const users = await User.find().exec();
    res.status(200).send(users);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});


// API TO GET COUNT OF INVOICE GENERATED IN ONE DAY

router.get("/getCount", verify, async (req, res) => {
  try {
    let currentDate = new Date()
    let oneDay = new Date()
    oneDay.setDate(oneDay.getDate() - 1);

    const invoiceCountToday = await Invoice.find({invoice_create_time:{
      $gte: new Date(oneDay.toISOString()),
      $lte: new Date(currentDate.toISOString())
    }}).exec();

    const invoiceCountTotal = await Invoice.find().exec();
    
    const invoiceCountTodayRes = invoiceCountToday.length;
    const invoiceCountTotalRes = invoiceCountTotal.length;
    const count = {
      invoiceCountTodayRes, invoiceCountTotalRes
    }
    
    res.status(200).send(count);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

// API TO SEARCH INVOICE BASED ON INVOICE NUMBER

router.post("/searchInvoice", verify, async (req, res) => {
  try {
    const invoice = await Invoice.find({ invoiceNumber: req.body.invoiceNumber }).exec();
    res.status(200).send(invoice);
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});


// API TO GENERATE PDF
router.post('/genearatePDF',  async (req, res) => {

  console.log(JSON.stringify(req.body));
  // Read HTML Template
  var html = fs.readFileSync('template.html', 'utf8');
  var options = {
    // format: "A3",
    // orientation: "portrait",
    width:"1366px",
    height:"2000px",
    border: "10mm",
    header: {
      height: "45mm",

    }
  };


  var document = {
    html: html,
    data: {
      intro: "Invoice app",
      data: req.body
    },
    path: `./GeneratedPDF/${req.body.invoiceNumber}.pdf`
  };


  pdf.create(document, options)
    .then(res1 => {
      console.log(res1);
      let redirectURL = process.env.backendBaseURL + `/${req.body.invoiceNumber}.pdf`;
      return res.status(200).send(redirectURL);
    })
    .catch(error => {
      console.error(error)
    });

})



module.exports = router;
