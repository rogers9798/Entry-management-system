var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Visitor = require("../models/visitor");
var bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config();
var alert = require("alert");

const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
const client = require("twilio")(accountSid, authToken);

router.get("/", function (req, res, next) {
  return res.render("index.ejs");
});

var BCRYPT_SALT_ROUNDS = 12;

router.post("/", function (req, res, next) {
  // console.log("Login data : \n")
  // console.log("email : "+req.body.email,"username : "+ req.body.username+"\n");
  var personInfo = req.body;

  if (
    !personInfo.email ||
    !personInfo.username ||
    !personInfo.password ||
    !personInfo.passwordConf ||
    !personInfo.phone
  ) {
    res.send();
  } else {
    if (personInfo.password == personInfo.passwordConf) {
      User.findOne({ email: personInfo.email }, function (err, data) {
        if (!data) {
          var c;
          User.findOne({}, function (err, data) {
            if (data) {
              // console.log("if");
              c = data.unique_id + 1;
            } else {
              c = 1;
            }
            bcrypt
              .hash(personInfo.password, BCRYPT_SALT_ROUNDS)
              .then(function (hashedPassword) {
                personInfo.passwordConf = hashedPassword;
                personInfo.password = hashedPassword;

                var newPerson = new User({
                  unique_id: c,
                  email: personInfo.email,
                  username: personInfo.username,
                  phone: personInfo.phone,
                  password: personInfo.password,
                  passwordConf: personInfo.passwordConf,
                });
                console.log("Login data : \n");
                console.log(newPerson);

                newPerson.save(function (err, Person) {
                  if (err) console.log(err);
                  else console.log("Success");
                });
              })
              // .then(function() {
              // 	res.send();
              // })
              .catch(function (error) {
                console.log("Error saving user: ");
                console.log(error);
                next();
              });
          })
            .sort({ _id: -1 })
            .limit(1);
          res.send({ Success: "You are regestered,You can login now." });
        } else {
          res.send({ Success: "Email is already used." });
        }
      });
    } else {
      res.send({ Success: "password is not matched" });
    }
  }
});

router.get("/login", function (req, res, next) {
  return res.render("login.ejs");
});

router.post("/login", function (req, res, next) {
  //console.log(req.body);
  User.findOne({ email: req.body.email }, function (err, data) {
    if (data) {
      if (bcrypt.compare(data.password, req.body.password)) {
        //console.log("Done Login");
        req.session.userId = data.unique_id;
        //console.log(req.session.userId);
        res.send({ Success: "Success!" });
      } else {
        res.send({ Success: "Wrong password!" });
      }
    } else {
      res.send({ Success: "This Email Is not regestered!" });
    }
  });
});

router.get("/profile", function (req, res, next) {
  console.log("profile");
  User.findOne({ unique_id: req.session.userId }, async (err, data) => {
    console.log("data");
    console.log(data);
    if (!data) {
      res.redirect("/");
    } else {
      const visitors = await Visitor.find();
      console.log(visitors);

      return res.render("data.ejs", {
        name: data.username,
        email: data.email,
        visitors: visitors,
      });
    }
  });
});

router.get("/logout", function (req, res, next) {
  console.log("logout");
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect("/");
      }
    });
  }
});

router.get("/forgetpass", function (req, res, next) {
  res.render("forget.ejs");
});

router.post("/forgetpass", function (req, res, next) {
  //console.log('req.body');
  //console.log(req.body);
  User.findOne({ email: req.body.email }, function (err, data) {
    console.log("email : " + data.email, "Username : " + data.username);
    if (!data) {
      res.send({ Success: "This Email Is not regestered!" });
    } else {
      bcrypt
        .hash(req.body.password, BCRYPT_SALT_ROUNDS)
        .then(function (hashedPassword) {
          req.body.password = hashedPassword;
          req.body.passwordConf = hashedPassword;

          if (req.body.password == req.body.passwordConf) {
            data.password = req.body.password;
            data.passwordConf = req.body.passwordConf;

            data.save(function (err, Person) {
              if (err) console.log(err);
              else console.log("Success");
              res.send({ Success: "Password changed!" });
            });
          } else {
            res.send({
              Success:
                "Password does not matched! Both Password should be same.",
            });
          }
        })
        // .then(function() {
        // 	res.send();
        // })
        .catch(function (error) {
          console.log("Error saving user: ");
          console.log(error);
          next();
        });
    }
  });
});

router.post("/visitors", async (req, res) => {
  try {
    if (
      (req.body.vname === "") |
      (req.body.vemail === "") |
      (req.body.vnumber === "") |
      (req.body.host === "")
    ) {
      console.log("error", "fields cannot be empty");
      res.redirect("back");
      return;
    }
    var check = await Visitor.find();
    console.log(check);

    const visitor = new Visitor({
      email: req.body.vemail,
      Name: req.body.vname,
      phone: req.body.vnumber,
      host: req.body.host,
    });
    await visitor.save();

    const visitors = await Visitor.find();
    console.log(visitors);
    return res.render("data.ejs", {
      visitors: visitors,
      name: req.body.host,
      email: req.body.email,
    });
  } catch (error) {
    res.send("error", "something went wrong");
    res.redirect("back");
  }
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  auth: {
    type: "login",
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

router.post("/visitor/:id/checkin", async (req, res) => {
  try {
    const data = {
      checkin: Date.now(),
    };
    const visitor = await Visitor.findById(req.params.id);
    // if already checked in don't allow to checkin
    if (visitor.entry && visitor.entry.length > 0) {
      const lastCheckIn = visitor.entry[visitor.entry.length - 1];
      const lastCheckInTimestamp = lastCheckIn.checkin.getTime();
      if (Date.now() > lastCheckInTimestamp + 100) {
        alert("Error :\n" + `${visitor.Name} has checked in for today already`);
        res.redirect("/profile");
      }
    } else {
      visitor.entry.push(data);
      await visitor.save();
      alert(
        "success:\n" +
          `${visitor.Name} checked in for today successfully, email & sms sent to host`
      );

      var hostName = visitor.host;
      var hostEmail = req.body.email;
      console.log(hostEmail);
      var visitorName = visitor.Name;
      var visitorEmail = visitor.email;
      var visitorPhone = visitor.phone;
      var lastCheck = visitor.entry[visitor.entry.length - 1];
      var visitorCheckin = lastCheck.checkin.getTime();
      var dateIST = new Date(visitorCheckin);
      dateIST.setHours(dateIST.getHours() + 5);
      dateIST.setMinutes(dateIST.getMinutes() + 30);
      var message =
        "New Checkin:\n" +
        "Name: " +
        visitorName +
        "\nEmail: " +
        visitorEmail +
        "\nPhone: " +
        visitorPhone +
        "\nCheckin: " +
        dateIST.toGMTString() +
        "\nhost:" +
        hostName;

      const list = [hostEmail, visitorEmail];
      var mailOptions = {
        from: process.env.EMAIL,
        to: list,
        subject: "Mail sent using Entry Management Application",
        text: message,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log("email sent: " + info.response);
        }
      });

      client.messages
        .create({
          body: message,
          from: process.env.NumFrom,
          to: process.env.NumTo,
        })
        .then((message) => console.log(message.sid));

      res.redirect("/profile");
    }
  } catch (err) {
    alert("something went wrong" + err);
  }
});

router.post("/visitor/:id/checkout", async (req, res) => {
  try {
    const visitor = await Visitor.findOne({ _id: req.params.id });
    if (visitor.entry && visitor.entry.length > 0) {
      const lastEntry = visitor.entry[visitor.entry.length - 1];
      if (lastEntry.checkout.time) {
        alert("error:\n" + `${visitor.Name} already checked out`);
        res.redirect("/profile");
        return;
      }

      lastEntry.checkout.time = Date.now();
      await visitor.save();
      alert(
        "success:\n" +
          `${visitor.Name} successfully checked out, email sent to visitor`
      );

      // Name
      var visitorName = visitor.Name;
      // Phone
      var visitorPhone = visitor.phone;
      // Email
      var visitorEmail = visitor.email;
      // Check-in time
      var lastCheck = visitor.entry[visitor.entry.length - 1];
      var visitorCheckin = lastCheck.checkin.getTime();
      var dateIST = new Date(visitorCheckin);
      dateIST.setHours(dateIST.getHours() + 5);
      dateIST.setMinutes(dateIST.getMinutes() + 30);
      var dateISTCheckin = dateIST.toGMTString();
      // Check-out time
      var visitorCheckout = lastCheck.checkout.time.getTime();
      var dateISTCheckout = new Date(visitorCheckout);
      dateISTCheckout.setHours(dateISTCheckout.getHours() + 5);
      dateISTCheckout.setMinutes(dateISTCheckout.getMinutes() + 30);

      // Host name
      var hostName = visitor.host;
      // Host email
      var hostEmail = process.env.EMAIL;

      const list = [hostEmail, visitorEmail];
      var message =
        "You have successfully checked out: \n\n" +
        "Name: " +
        visitorName +
        "\nPhone: " +
        visitorPhone +
        "\nCheckin: " +
        dateISTCheckin +
        "\nCheckout: " +
        dateISTCheckout.toGMTString() +
        "\nHost Name: " +
        hostName +
        "\nHost Email: " +
        hostEmail +
        "\n";

      var mailOptions = {
        from: process.env.EMAIL,
        to: list,
        subject: "Mail sent using Jotting Entry Management Application",
        text: message,
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log("email sent: " + info.response);
        }
      });

      res.redirect("/profile");
    } else {
      alert("error:\n" + `${visitor.name} does not have any check in entry`);
      res.redirect("/profile");
    }
  } catch (err) {
    console.log("something went wrong", err);
  }
});

module.exports = router;
