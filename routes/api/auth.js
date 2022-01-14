const router = require("express").Router();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { check, validationResult } = require("express-validator");
const db = require("../../services/db");
const { redisClient } = require("../../services/redis");
const { PROD_FRONTEND_URL, LOCAL_FRONTEND_URL } = require("../../config");
require("dotenv").config();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

const RESET_PREFIX_EMAIL = "RESET_EMAIL";
const EMAIL_PREFIX_RESET = "EMAIL_RESET";
const endpoint = process.env.NODE_ENV === "production" ? PROD_FRONTEND_URL : LOCAL_FRONTEND_URL;

const checkEmailExist = (email) => {
	if (typeof email === "undefined") {
		return false;
	}
	const selectUserSQl = "SELECT * FROM users WHERE email = ?";
	return new Promise((resolve, reject) => {
		db.query(selectUserSQl, email, (selectUserErr, selectUserRes) => {
			if (selectUserRes != null && selectUserRes.length != 0) {
				console.log("Email already exists");
				reject(false);
			}
			console.log("Can use email for registration");
			resolve(true);
		});
	});
};

const checkRepeatedPassword = (repeatedPassword, req) => {
	if (repeatedPassword !== req.body.password) {
		console.log("repeated password not same");
		return false;
	}
	return true;
};

const registerValidation = [
	check("email", "Email must be of valid email format.").isEmail(),
	check("email", "Email already exists.").custom((value) => checkEmailExist(value)),
	check("displayName")
		.isLength({ min: 1 })
		.withMessage("Display Name must contain at least 1 character."),
	check("password", "Password must contain at least 8 characters, numbers, and letters.")
		.isLength({ min: 8 })
		.matches("[0-9]")
		.matches("[A-z]"),
	check("repeatedPassword", "Please enter the same password.").custom((value, { req }) =>
		checkRepeatedPassword(value, req)
	),
];

const resetValidation = [
	check("password", "Password must contain at least 8 characters, numbers, and letters.")
		.isLength({ min: 8 })
		.matches("[0-9]")
		.matches("[A-z]"),
	check("repeatedPassword", "Please enter the same password.").custom((value, { req }) =>
		checkRepeatedPassword(value, req)
	),
];

router.post("/recover", async (req, res) => {
	const selectUserSQl = "SELECT * FROM users WHERE email = ?";
	const email = req.body.email;
	db.query(selectUserSQl, email, async (selectUserErr, selectUserRes) => {
		if (selectUserRes == null || selectUserRes.length == 0) {
			console.log("email not found");
			return res.status(401).json({
				message: "Email not registered.",
			});
		}
		const email = selectUserRes[0].email;

		// Check if password reset request for email already exists.
		let resetID = await redisClient.get(`${EMAIL_PREFIX_RESET}_${email}`);
		if (!resetID) {
			resetID = crypto.randomBytes(16).toString("hex");
			await redisClient.set(`${RESET_PREFIX_EMAIL}_${resetID}`, email);
			await redisClient.set(`${EMAIL_PREFIX_RESET}_${email}`, resetID);
			console.log(`random ID mapped to email: ${resetID}`);
		}

		/*
		let resetID = emailResetIDMap.get(email);
		if (typeof existingResetID === "undefined") {
			// map some random id to email to keep track
			resetID = crypto.randomBytes(16).toString("hex");
			resetIDEmailMap.set(resetID, email);
			emailResetIDMap.set(email, resetID);
			console.log(`random ID mapped to email: ${resetID}`);
		}
		*/

		// use hashed password as secret.
		const password = selectUserRes[0].password;
		// get some token that will expire in 15 mins. To expire the link that is sent to user.
		const resetToken = jwt.sign({ email: email }, password, { expiresIn: "15m" });
		console.log(`signed reset token: ${resetToken}`);

		const link = endpoint + "reset/" + resetID + "/" + resetToken;
		console.log(`link: ${link}`);

		//send email
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		});

		const message = {
			from: "PeerWatch Team <peerwatchteam@gmail.com>",
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

		// For testing
		if (process.env.NODE_ENV === "production") {
			return res.status(200).json({
				message: "Email sent",
			});
		} else {
			return res.status(200).json({
				message: "Email sent",
				resetID: resetID,
				resetToken: resetToken,
			});
		}
	});
});

router.post("/authreset", async (req, res) => {
	try {
		const resetID = req.body.rid;
		if (typeof resetID === "undefined") {
			// no random id provided
			console.log("resetID not given");

			return res.status(401).json({
				message: "Reset ID invalid.",
			});
		}

		// get email from mapped random ID
		const email = await redisClient.get(`${RESET_PREFIX_EMAIL}_${resetID}`);
		if (!email) {
			// somehow email not mapped or invalid;
			console.log("email not mapped");

			return res.status(401).json({
				message: "Reset ID invalid.",
			});
		}

		/*
		const email = resetIDEmailMap.get(resetID);
		if (typeof email === "undefined") {
			// somehow email not mapped or invalid
			console.log("email not mapped");

			return res.status(401).json({
				message: "Reset ID invalid.",
			});
		}
		*/

		const authHeader = req.headers["authorization"];
		const resetToken = authHeader && authHeader.split(" ")[1];
		if (typeof resetToken === "undefined") {
			// no token
			console.log("resetToken not given");

			return res.status(401).json({
				message: "Reset Token invalid.",
			});
		}

		// Use email to find account's old password from DB to verify jwt token
		const selectUserSQl = "SELECT * FROM users WHERE email = ?";
		db.query(selectUserSQl, email, (selectUserErr, selectUserRes) => {
			if (selectUserRes == null || selectUserRes.length == 0) {
				console.log("Account somehow not found");
				return res.status(401).json({
					message: "Invalid email.",
				});
			}
			const oldPassword = selectUserRes[0].password;
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
	} catch (err) {
		console.log("something went wrong in authreset");
		console.log(err.message);
		return res.status(500).send(err.message);
	}
});

router.put("/reset", resetValidation, async (req, res) => {
	try {
		const resetID = req.body.rid;
		if (typeof resetID === "undefined") {
			// no random id
			console.log("resetID not given");

			return res.status(401).json({
				message: "Reset ID invalid.",
			});
		}

		// get email from mapped random ID
		const email = await redisClient.get(`${RESET_PREFIX_EMAIL}_${resetID}`);
		if (!email) {
			// somehow email not mapped or invalid;
			console.log("email not mapped");

			return res.status(401).json({
				message: "Reset ID invalid.",
			});
		}
		/*
		const email = resetIDEmailMap.get(resetID);
		if (typeof email === "undefined") {
			// somehow email not mapped or invalid
			console.log("email not mapped");

			return res.status(401).json({
				message: "Reset ID invalid.",
			});
		}
		*/

		// if password has validation error
		const errors = await validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		// Set new password
		// if email somehow does not exist, then return error.
		const newPassword = await bcrypt.hash(req.body.password, 10);
		const updatePasswordSQL = "UPDATE users SET password = ? WHERE email = ?";
		db.query(
			updatePasswordSQL,
			[newPassword, email],
			async (updatePasswordErr, updatePasswordRes) => {
				if (updatePasswordRes.affectedRows == 0) {
					return res.status(401).json({
						message: "Invalid email.",
					});
				}

				// delete mapping since able to reset
				await redisClient.del(`${RESET_PREFIX_EMAIL}_${resetID}`);
				await redisClient.del(`${EMAIL_PREFIX_RESET}_${email}`);
				//resetIDEmailMap.delete(resetID);
				//emailResetIDMap.delete(email);
				console.log("Password resetted");
				return res.status(200).json({
					message: "Password resetted successfully.",
				});
			}
		);
	} catch (err) {
		console.log("something went wrong in reset");
		console.log(err.message);
		return res.status(500).send(err.message);
	}
});

router.post("/register", registerValidation, async (req, res) => {
	try {
		// if account credentials has validation errors
		const errors = await validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		const email = req.body.email;
		const password = await bcrypt.hash(req.body.password, 10);

		// Create and add account
		const newUser = {
			email: email,
			displayName: req.body.displayName,
			password: password,
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
			return res.status(201).json({
				message: "Account registered.",
				token: accessToken,
				userId: newUser.userId,
				displayName: newUser.displayName,
				email: newUser.email,
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
