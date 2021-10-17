const router = require("express").Router();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { check, validationResult } = require("express-validator");
require("dotenv").config();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const accounts = [];

const resets = new Map();

var registerValidation = [
	check("email", "Email must be of valid email format").isEmail(),
	check("displayname").isLength({ min: 1 }).withMessage("Display Name must be at least 1 character"),
	check("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters.").matches("[0-9]").withMessage("Password must contain numbers.").matches("[A-z]").withMessage("Password must contain letters.")
];

var resetValidation = [
	check("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters.").matches("[0-9]").withMessage("Password must contain numbers.").matches("[A-z]").withMessage("Password must contain letters."),
	
];

router.post("/recover", async (req, res) => {
	const account = accounts.find(account => account.email === req.body.email);
	if (account == null) {
		// email not found.
		console.log("email not found");
		
		return res.status(401).json({
			message: "Account not registered."
		});
	}
	
	const email = account.email;
	// map some random id to email
	const randomID = crypto.randomBytes(16).toString('hex');
	resets.set(randomID, email);
	console.log(`random ID mapped to email: ${randomID}`);
	
	const password = account.password;
	const resetToken = jwt.sign({email: email}, password, { expiresIn: '15m' });
	console.log(`signed reset token: ${resetToken}`);
	
	const link = "http://localhost:3000/resetapi/" + randomID + "/" + resetToken;
	console.log(`link: ${link}`);
	
	//send email
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			// The credentials posted in group chat
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS
		}
	});
	
	const message = {
		from: "PeerWatch Team <peerwatchteam@gmail.com>",
		// Can change to some disposable email to test
		to: email,
		subject: "PeerWatch Account Password Reset",
		text: `Dear User,
		
The following is the link to reset your password:
${link}
		
Do note that this link is only valid for 15 minutes.
		
Thank You.
		
Cheers,
Peerwatch Team`
	};
	
	transporter.sendMail(message, (err, body) => {
		if (err) {
			console.log(err);
			return res.status(500).send(err.message);
		}
		console.log("email sent: " + body.response);
		console.log(body);
	});
	
	// remove message after testing
	return res.status(200).json({
		message: "Email sent",
		ID: randomID,
		token: resetToken
	})
});

router.put("/reset/:_id", resetValidation, async (req, res) => {
		try {
			// change the errors when want to test what went wrong
			const randomID = req.params._id;
			if (randomID == null) {
				// no random id
				console.log("randomID not given");
				
				return res.status(401).json({
					message: "Invalid link."
				});
			}
			
			var email = resets.get(randomID);
			if (typeof email == undefined) {
				// somehow email not mapped or invalid
				console.log("email somehow not mapped");
				
				return res.status(401).json({
					message: "Invalid link."
				});
			}
			
			const authHeader = req.headers["authorization"];
			const resetToken = authHeader && authHeader.split(" ")[1];
			if (resetToken == null) {
				// no token
				console.log("resetToken not given")
				
				return res.status(401).json({
					message: "Invalid link."
				});
			}
			
			// get password from accounts list
			let oldPassword = null;
			let idx = -1;
			for (let i = 0; i < accounts.length; i++) {
				if (accounts[i].email === email) {
					oldPassword = accounts[i].password
					idx = i;
				}
			}
			
			if (oldPassword == null) {
				console.log("Account somehow not found");
				
				return res.status(401).json({
					message: "Account somehow not found."
				});
			}
			
			// check if token invalid or expired.
			jwt.verify(resetToken, oldPassword, (err, account) => {
				if (err) {
					// token expired or invalid
					console.log("token invalid or expired");
					
					return res.status(401).json({
						message: "Invalid link."
					});
				}
			});
			
			// if password has validation error
			const errors = await validationResult(req);
			if (!errors.isEmpty()) {
					return res.status(422).json({ errors: errors.array() });
			}
			
			const newPassword = await bcrypt.hash(req.body.password, 10);
			// set new password
			accounts[idx].password = newPassword;
			
			// delete map since able to reset
			resets.delete(randomID);
			
			console.log("Password resetted");
			return res.status(200).json({
				message: "Password resetted successfully."
			});
		} catch(err) {
			console.log("something went wrong in reset");
			
			return res.status(500).send(err.message);
		}
});

router.post("/register", registerValidation, async (req, res) => {
		try {
			// if account credentials has validation errors
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
					return res.status(422).json({ errors: errors.array() });
			}
			
			const email = req.body.email;
			const password = await bcrypt.hash(req.body.password, 10);
			
			
			// check if email already exists
			const duplicate = accounts.find(account => account.email === email);
			if (duplicate != null) {
				console.log("email already exists");
				
				// 409 might not be the best option here
				return res.status(409).json({
					message: "Email already exists."
				})
			}
			
			// Create and add account
			const account = {
				email: email,
				displayname: req.body.displayname,
				password: password,
				isGoogle: false
			}
			// Need update DB also
			accounts.push(account)
			
			const accessToken = jwt.sign(account, process.env.ACCESS_SECRET, { expiresIn: '30 days' });
			
			console.log("Account created");
			// Successful account creation
			return res.status(201).json({
				message: "Account registered.",
				token: accessToken,
				displayname: account.displayname
			});
		} catch(err) {
			console.log("something went wrong in register");
			
			return res.status(500).send(err.message);
		}
});

router.get("/login", async (req, res) => {
	// depends, but may need to retrieve from db
	const account = accounts.find(account => account.email === req.body.email);
	if (account == null) {
		console.log("email not found");
		
		// email not found.
		return res.status(401).json({
			message: "Account not registered."
		});
	}
	try {
		if(await bcrypt.compare(req.body.password, account.password)) {
			// can change duration here to test expiry
			const accessToken = jwt.sign(account, process.env.ACCESS_SECRET, { expiresIn: '30 days' });
			
			console.log("logged in");
			return res.status(200).json({
				message: "Logged in successfully",
				token: accessToken,
				displayname: account.displayname
			});
		} else {
			console.log("password dont match");
			
			// password does not match.
			return res.status(401).json({
				message: "Account not registered."
			});
		}
	} catch(err) {
		console.log("something went wrong in login");
		
		return res.status(500).send(err.message);
	}
});

router.get("/authtoken", (req, res) => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];
	if (token == null) {
		console.log("no token provided");
		
		return res.status(401).json({
			message: "Account not authenticated."
		});
	}
	
	jwt.verify(token, process.env.ACCESS_SECRET, (err, account) => {
		if (err) {
			console.log("token invalid or expired");
			
			return res.status(401).json({
				message: "Account not authenticated."
			});
		}
		
		console.log("account authenticated");
		return res.status(200).json({
			message: "Account authenticated."
		});
	});
});

module.exports = router;