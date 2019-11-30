# Jotting-entry-management-system

[![Website shields.io](https://img.shields.io/badge/nodeJS-server-green.svg)](https://github.com/rogers9798/Jotting-entry-management-system) 


## About

Jotting is an entry management system made using Nodejs and its frameworks.
This system has multiple functionalities as stated below :

* Host Register
* Login
* Visitor details entry
* Visitor checkin-mail and sms transferred to host
* Visitor checkout-mail transferred to host and visitor


## Prerequisites 


* Node.js installed<br>
* Mongodb installed<br>
* An account on Twilio for keys, token and trial number


## Configuration

* Start the server using `nodemon start` in your preffered code editor.
* Open <code>`localhost:3000`</code> on your web browser for the main interface.<br>
* The inteface routes to <code>`localhost:3000/index.ejs`</code> using nodeJS and express.<br>
* Make sure you configured `server.js` file according to your mongodb database and `routes/index.js` according to the environment variables.<br>

### <pre>Note : Add the keys, emails, passwords, SECRET(used for sessions), phone numbers in an .env file in root directory of the project</pre>


[![img shields.io](https://img.shields.io/badge/JARVIS-rogers9798-orange.svg)](https://github.com/rogers9798/Tweet-spotter)

