const nodemailer = require("nodemailer");

module.exports = async function (req) {
    console.log("mail of person adding req in sendMail func is: "+ req.email);
    
     const updaterMail = req.email;
     let message = req.message;
    var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.email, 
        to: 'vishal377@gmail.com', 
        subject: req.subject, 
        html: ''
    };

    
    let sampleMail = '<p>Hi, </p>'
                    +`<p>This mail is to inform you, that ${updaterMail} ${message}</p>`
                    +'<p>Regards</p>'


    try {
        mailOptions.html = sampleMail;
        await transporter.sendMail(mailOptions);
        console.log("mail sent");
        
        return {resMsg: "Verification mail sent"};
    } catch (error) {
        console.log( "error in mail sent is: "+ error);
        return {resMsg: "Internal Server Error while sending mail"};
    }

}

