const router = require("express").Router();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { check, validationResult } = require("express-validator");
const db = require("../../services/db");
require("dotenv").config();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// Delete when done integrating recover and reset with DB
const accounts = [
	{
		userId: 1,
		email: "random@outlook.com",
		displayName: "random",
		password: "random",
		isGoogle: false,
	},
	{
		userId: 2,
		email: "cs3219test@outlook.com",
		displayName: "cs3219",
		password: "$10$Q3vJw6t1PFQS6tQQxCjWguKs4.qFSyBeZ5ECyrTmUFcQfkLogVXMy",
		isGoogle: false,
	},
	{
		userId: 3,
		email: "test@outlook.com",
		displayName: "test",
		password: "test",
		isGoogle: false,
	},
];

// Might wanna store this in db?
const resets = new Map();

var registerValidation = [
	check("email", "Email must be of valid email format.").isEmail(),
	check("displayName")
		.isLength({ min: 1 })
		.withMessage("Display Name must be at least 1 character."),
	check("password")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters.")
		.matches("[0-9]")
		.withMessage("Password must contain numbers.")
		.matches("[A-z]")
		.withMessage("Password must contain letters."),
];

var resetValidation = [
	check("password")
		.isLength({ min: 8 })
		.withMessage("Password must be at least 8 characters.")
		.matches("[0-9]")
		.withMessage("Password must contain numbers.")
		.matches("[A-z]")
		.withMessage("Password must contain letters."),
];

router.post("/recover", async (req, res) => {
	// find account with email
	const account = accounts.find((account) => account.email === req.body.email);
	if (typeof account === "undefined") {
		// email not found.
		console.log("email not found");

		return res.status(401).json({
			message: "Email not registered.",
		});
	}

	const email = account.email;

	// map some random id to email to keep track
	const randomID = crypto.randomBytes(16).toString("hex");
	resets.set(randomID, email);
	console.log(`random ID mapped to email: ${randomID}`);

	// use hashed password as secret.
	const password = account.password;
	// get some token that will expire in 15 mins. To expire the link that is sent to user.
	const resetToken = jwt.sign({ email: email }, password, { expiresIn: "15m" });
	console.log(`signed reset token: ${resetToken}`);

	// Need change the link later.
	const link = "http://localhost:3000/reset/" + randomID + "/" + resetToken;
	console.log(`link: ${link}`);

	//send email
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			// The credentials posted in group chat
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
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
Peerwatch Team`,
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
		token: resetToken,
	});
});

router.post("/authreset", (req, res) => {
	// change the errors when want to test what went wrong
	const randomID = req.body.rid;
	if (randomID === null) {
		// no random id
		console.log("randomID not given");

		return res.status(401).json({
			message: "Reset ID invalid.",
		});
	}

	// get email from mapped random ID
	var email = resets.get(randomID);
	if (typeof email === "undefined") {
		// somehow email not mapped or invalid
		console.log("email not mapped");

		return res.status(401).json({
			message: "Reset ID invalid.",
		});
	}

	const authHeader = req.headers["authorization"];
	const resetToken = authHeader && authHeader.split(" ")[1];
	if (resetToken === null) {
		// no token
		console.log("resetToken not given");

		return res.status(401).json({
			message: "Reset Token invalid.",
		});
	}

	// get password from accounts list
	// Use email to find account's old password from DB to verify jwt token
	let oldPassword = null;
	let idx = -1;
	for (let i = 0; i < accounts.length; i++) {
		if (accounts[i].email === email) {
			oldPassword = accounts[i].password;
			idx = i;
		}
	}

	if (oldPassword === null) {
		console.log("Account somehow not found");

		return res.status(401).json({
			message: "Invalid email.",
		});
	}

	// check if token invalid or expired.
	jwt.verify(resetToken, oldPassword, (err, account) => {
		if (err) {
			// token expired or invalid
			console.log("token invalid or expired");

			return res.status(401).json({
				message: "Invalid link.",
			});
		} else {
			console.log("token verified");

			return res.status(200).json({
				message: "Reset token verified.",
			});
		}
	});
});

router.put("/reset", resetValidation, async (req, res) => {
	try {
		// change the errors when want to test what went wrong
		const randomID = req.body.rid;
		if (randomID === null) {
			// no random id
			console.log("randomID not given");

			return res.status(401).json({
				message: "Reset ID invalid.",
			});
		}

		// get email from mapped random ID
		var email = resets.get(randomID);
		if (typeof email === undefined) {
			// somehow email not mapped or invalid
			console.log("email not mapped");

			return res.status(401).json({
				message: "Reset ID invalid.",
			});
		}

		// if password has validation error
		const errors = await validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		// Set new password
		// if email somehow does not exist, then return error.
		let idx = -1;
		const newPassword = await bcrypt.hash(req.body.password, 10);
		for (let i = 0; i < accounts.length; i++) {
			if (accounts[i].email === email) {
				accounts[i].password = newPassword;
				idx = i;
			}
		}

		if (idx === -1) {
			return res.status(401).json({
				message: "Invalid email.",
			});
		}

		// delete mapping since able to reset
		resets.delete(randomID);

		console.log("Password resetted");
		return res.status(200).json({
			message: "Password resetted successfully.",
		});
	} catch (err) {
		console.log("something went wrong in reset");
		console.log(err.message);
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
		const selectUserSQl = "SELECT * FROM users WHERE email = ?";
		db.query(selectUserSQl, email, (selectUserErr, selectUserRes) => {
			if (selectUserRes != null && selectUserRes.length != 0) {
				console.log("email already exists");
				return res.status(409).json({
					message: "Email already exists.",
				});
			}

			// Create and add account
			let newUser = {
				email: email,
				displayName: req.body.displayName,
				password: password,
				isGoogle: false,
			};
			const insertUserSQL = "INSERT INTO users SET ?";
			db.query(insertUserSQL, newUser, (insertUserErr, insertUserRes) => {
				if (insertUserErr) {
					return res.status(500).send(insertUserErr);
				}
				newUser.userId = insertUserRes.insertId;

				const accessToken = jwt.sign(newUser, process.env.ACCESS_SECRET, {
					expiresIn: "30 days",
				});
				console.log("Account created");
				res.status(201).json({
					message: "Account registered.",
					token: accessToken,
					userId: newUser.userId,
					displayName: newUser.displayName,
					email: newUser.email,
				});
			});
		});
	} catch (err) {
		console.log("something went wrong in register");
		console.log(err.message);
		return res.status(500).send(err.message);
	}
});

router.post("/login", async (req, res) => {
	// check if email already exists
	const selectUserSQl = "SELECT * FROM users WHERE email = ?";
	const email = req.body.email;
	db.query(selectUserSQl, email, (selectUserErr, selectUserRes) => {
		if (selectUserRes == null || selectUserRes.length == 0) {
			console.log("email not found");
			return res.status(401).json({
				message: "Account not registered. Please enter the correct email/password.",
			});
		}
		try {
			const account = {
				userId: selectUserRes[0].userId,
				email: selectUserRes[0].email,
				displayName: selectUserRes[0].displayName,
				password: selectUserRes[0].password,
				isGoogle: selectUserRes[0].isGoogle,
			};
			bcrypt.compare(req.body.password, account.password, (err, comparison) => {
				// can change duration here to test expiry
				if (comparison) {
					const accessToken = jwt.sign(account, process.env.ACCESS_SECRET, {
						expiresIn: "30 days",
					});

					console.log("logged in");
					return res.status(200).json({
						message: "Logged in successfully",
						token: accessToken,
						userId: account.userId,
						displayName: account.displayName,
						email: account.email,
					});
				} else {
					console.log("password dont match");

					// password does not match.
					return res.status(401).json({
						message: "Account not registered. Please enter the correct email/password.",
					});
				}
			});
		} catch (err) {
			console.log("something went wrong in login");
			console.log(err.message);
			return res.status(500).send(err.message);
		}
	});
});

router.post("/authtoken", (req, res) => {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];
	if (token == null) {
		console.log("no token provided");

		return res.status(401).json({
			message: "Account not authenticated.",
		});
	}

	jwt.verify(token, process.env.ACCESS_SECRET, (err, account) => {
		if (err) {
			console.log("token invalid or expired");

			return res.status(401).json({
				message: "Account not authenticated.",
			});
		}

		console.log("account authenticated");
		return res.status(200).json({
			message: "Account authenticated.",
			userId: account.userId,
			displayName: account.displayName,
			token: token,
			email: account.email,
		});
	});
});

module.exports = router;
