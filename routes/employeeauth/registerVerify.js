const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("auth-token");
  let adminJwt, managerJwt
  if (!token) return res.status(401).send("Access Denied");
    jwt.verify(token, process.env.ADMIN_TOKEN_SECRET, (err, verifiedJwt) => {
      adminJwt = verifiedJwt;
    })
    jwt.verify(token, process.env.MANAGER_TOKEN_SECRET, (err, verifiedJwt) => {
      managerJwt = verifiedJwt;
    })
  console.log(adminJwt || managerJwt)
  if(adminJwt || managerJwt){
    req.user = adminJwt || managerJwt;
    
    next();
 }else{
  res.status(400).send("Invalid token");
  console.log("Invalid token");
}

};
