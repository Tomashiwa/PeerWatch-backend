const app = require("../server");
const chai = require("chai");
const chaiHttp = require("chai-http");
const db = require("../services/db");

chai.use(chaiHttp);
chai.use(require("chai-things"));
chai.should();

after(async () => {
	const id = "0"
	const sql = "DELETE FROM users WHERE userId > ?";
	await db.query(sql, id, (err, res) => {
		if (err) {
			console.log(err);
		}
		console.log(res);
	});
});

let userId = null;
let userId2 = null;
let resetID = null;
let resetToken = null;
let accessToken = null;

describe("POST /api/auth/register", () => {
	it("register with no input", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(6);
				res.body.errors.should.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	it("register with only display name", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				displayName: "test"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(5);
				res.body.errors.should.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with only wrong email format", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				email: "test"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(5);
				res.body.errors.should.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with only correct email format", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				email: "test@test.com"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(4);
				res.body.errors.should.not.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with < 8 characters password, diff repeated password", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				password: "asd"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(6);
				res.body.errors.should.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with > 8 only characters password, diff repeated password", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				password: "asdasdasd"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(5);
				res.body.errors.should.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with > 8 only digits password, diff repeated password", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				password: "123123123"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(5);
				res.body.errors.should.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with valid password, diff repeated password", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				password: "asdasd123"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(4);
				res.body.errors.should.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with < 8 characters password, same repeated password", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				password: "asd",
				repeatedPassword: "asd"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(5);
				res.body.errors.should.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with > 8 only characters password, same repeated password", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				password: "asdasdasd",
				repeatedPassword: "asdasdasd"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(4);
				res.body.errors.should.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with > 8 only digits password, same repeated password", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				password: "123123123",
				repeatedPassword: "123123123"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(4);
				res.body.errors.should.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with valid password, same repeated password", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				password: "asdasd123",
				repeatedPassword: "asdasd123"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(3);
				res.body.errors.should.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with display name and invalid email", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				displayName: "asd",
				email: "asd"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(4);
				res.body.errors.should.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with display name and valid email", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				displayName: "asd",
				email: "test@test.com"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(3);
				res.body.errors.should.not.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with display name, valid email, < 8 character password, diff repeated password", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				displayName: "asd",
				email: "test@test.com",
				password: "asd"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(3);
				res.body.errors.should.not.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with display name, valid email, > 8 only character password, diff repeated password", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				displayName: "asd",
				email: "test@test.com",
				password: "asdasdasd"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(2);
				res.body.errors.should.not.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with display name, valid email, > 8 only digits password, diff repeated password", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				displayName: "asd",
				email: "test@test.com",
				password: "asdasdasd"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(2);
				res.body.errors.should.not.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("register with display name, valid email, valid password, diff repeated password", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				displayName: "asd",
				email: "test@test.com",
				password: "asdasd123"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(1);
				res.body.errors.should.not.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
	
	it("successful registration", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				displayName: "test",
				email: "test@test.com",
				password: "password123",
				repeatedPassword: "password123"
			})
			.end((err, res) => {
				res.should.have.status(201);
				res.body.should.property("message", "Account registered.");
				userId = res.body.userId;
				accessToken = res.body.token;
				done();
			});
	})
	
	it("successful registration 2", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				displayName: "asd",
				email: "asd@asd.com",
				password: "asdasd123",
				repeatedPassword: "asdasd123"
			})
			.end((err, res) => {
				res.should.have.status(201);
				res.body.should.property("message", "Account registered.");
				userId2 = res.body.userId;
				done();
			});
	})
	
	it("email already exists", (done) => {
		chai.request(app)
			.post("/api/auth/register")
			.send({
				displayName: "test",
				email: "test@test.com",
				password: "password123",
				repeatedPassword: "password123"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(1);
				res.body.errors.should.not.contain.an.item.with.property("msg", "Email must be of valid email format.");
				res.body.errors.should.contain.an.item.with.property("msg", "Email already exists.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Display Name must contain at least 1 character.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Please enter the same password.");
				done();
			});
	})
})

describe("POST /api/auth/login", () => {
	it("only invalid email", (done) => {
		chai.request(app)
			.post("/api/auth/login")
			.send({
				email: "test"
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Account not registered. Please enter the correct email/password.");
				done()
			})
	})
	
	it("only valid email", (done) => {
		chai.request(app)
			.post("/api/auth/login")
			.send({
				email: "test@test.com"
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Account not registered. Please enter the correct email/password.");
				done()
			})
	})
	
	it("only invalid password", (done) => {
		chai.request(app)
			.post("/api/auth/login")
			.send({
				password: "test"
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Account not registered. Please enter the correct email/password.");
				done()
			})
	})
	
	it("only valid password", (done) => {
		chai.request(app)
			.post("/api/auth/login")
			.send({
				password: "password123"
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Account not registered. Please enter the correct email/password.");
				done()
			})
	})
	
	it("valid email invalid password", (done) => {
		chai.request(app)
			.post("/api/auth/login")
			.send({
				email: "test@test.com",
				password: "password"
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Account not registered. Please enter the correct email/password.");
				done()
			})
	})
	
	it("invalid email valid password", (done) => {
		chai.request(app)
			.post("/api/auth/login")
			.send({
				email: "test@test.co",
				password: "password123"
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Account not registered. Please enter the correct email/password.");
				done()
			})
	})
	
	it("successful login", (done) => {
		chai.request(app)
			.post("/api/auth/login")
			.send({
				email: "test@test.com",
				password: "password123"
			})
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.property("message", "Logged in successfully");
				done()
			})
	})
})

describe("POST /api/auth/authtoken", () => {
	it("successful auth", (done) => {
		chai.request(app)
			.post("/api/auth/authtoken")
			.set("authorization", "Bearer " + accessToken)
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.property("message", "Account authenticated.");
				done()
			})
	})
	
	it("no token", (done) => {
		chai.request(app)
			.post("/api/auth/authtoken")
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Account not authenticated.");
				done()
			})
	})
	
	it("invalid token", (done) => {
		chai.request(app)
			.post("/api/auth/authtoken")
			.set("authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJkaXNwbGF5TmFtZSI6InRlc3QiLCJwYXNzd29yZCI6IiQyYSQxMCRha3BhclpOdmdxTWNtT2pMOHhtdHIuQlkxOC8yb09jVmxhc2NBTUhVQnZ3Y2VsS29Id21kbSIsImlzR29vZ2xlIjpmYWxzZSwidXNlcklkIjozLCJpYXQiOjE2MzU5NTExNDgsImV4cCI6MYzODU0MzE0OH0.OAgjKadejDMC4ffHIsL8RPOqtiOG0DV1s3KrVKPPiho")
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Account not authenticated.");
				done()
			})
	})
})

describe("recover", () => {
	it("no email", (done) => {
		chai.request(app)
			.post("/api/auth/recover")
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Email not registered.");
				done()
			})
	})
	
	it("invalid email", (done) => {
		chai.request(app)
			.post("/api/auth/recover")
			.send({
				email: "test"
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Email not registered.");
				done()
			})
	})
	
	it("unregistered email", (done) => {
		chai.request(app)
			.post("/api/auth/recover")
			.send({
				email: "testing@test.com"
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Email not registered.");
				done()
			})
	})
	
	it("successful recover", (done) => {
		chai.request(app)
			.post("/api/auth/recover")
			.send({
				email: "test@test.com"
			})
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.property("message", "Email sent");
				resetID = res.body.resetID;
				resetToken = res.body.resetToken;
				done()
			})
	})
})

describe("POST /api/auth/authreset", () => {
	it("empty auth", (done) => {
		chai.request(app)
			.post("/api/auth/authreset")
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Reset ID invalid.");
				done()
			})
	})
	
	it("only invalid reset id", (done) => {
		chai.request(app)
			.post("/api/auth/authreset")
			.send({
				rid: "427a90ccb74942b13683d85105f944d"
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Reset ID invalid.");
				done()
			})
	})
	
	it("only valid reset id", (done) => {
		chai.request(app)
			.post("/api/auth/authreset")
			.send({
				rid: resetID
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Reset Token invalid.");
				done()
			})
	})
	
	it("only invalid token", (done) => {
		chai.request(app)
			.post("/api/auth/authreset")
			.set("authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJkaXNwbGF5TmFtZSI6InRlc3QiLCJwYXNzd29yZCI6IiQyYSQxMCRha3BhclpOdmdxTWNtT2pMOHhtdHIuQlkxOC8yb09jVmxhc2NBTUhVQnZ3Y2VsS29Id21kbSIsImlzR29vZ2xlIjpmYWxzZSwidXNlcklkIjozLCJpYXQiOjE2MzU5NTExNDgsImV4cCI6MYzODU0MzE0OH0.OAgjKadejDMC4ffHIsL8RPOqtiOG0V1s3KrVKPPiho")
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Reset ID invalid.");
				done()
			})
	})
	
	it("only valid token", (done) => {
		chai.request(app)
			.post("/api/auth/authreset")
			.set("authorization", "Bearer " + resetToken)
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Reset ID invalid.");
				done()
			})
	})
	
	it("invalid reset ID, valid token", (done) => {
		chai.request(app)
			.post("/api/auth/authreset")
			.set("authorization", "Bearer " + resetToken)
			.send({
				rid: "427a90ccb74942b13683d85105f944d"
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Reset ID invalid.");
				done()
			})
	})
	
	it("valid reset ID, invalid token", (done) => {
		chai.request(app)
			.post("/api/auth/authreset")
			.set("authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJkaXNwbGF5TmFtZSI6InRlc3QiLCJwYXNzd29yZCI6IiQyYSQxMCRha3BhclpOdmdxTWNtT2pMOHhtdHIuQlkxOC8yb09jVmxhc2NBTUhVQnZ3Y2VsS29Id21kbSIsImlzR29vZ2xlIjpmYWxzZSwidXNlcklkIjozLCJpYXQiOjE2MzU5NTExNDgsImV4cCI6MYzODU0MzE0OH0.OAgjKadejDMC4ffHIsL8RPOqtiOG0V1s3KrVKPPiho")
			.send({
				rid: resetID
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Invalid link.");
				done()
			})
	})
	
	it("successful authreset", (done) => {
		chai.request(app)
			.post("/api/auth/authreset")
			.set("authorization", "Bearer " + resetToken)
			.send({
				rid: resetID
			})
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.property("message", "Reset token verified.");
				done()
			})
	})
})

describe("PUT /api/auth/reset", () => {
	it("empty reset", (done) => {
		chai.request(app)
			.put("/api/auth/reset")
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Reset ID invalid.");
				done()
			})
	})
	
	it("only invalid reset ID", (done) => {
		chai.request(app)
			.put("/api/auth/reset")
			.send({
				rid: "427a90ccb74942b13683d85105f944d"
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Reset ID invalid.");
				done()
			})
	})
	
	it("only valid password", (done) => {
		chai.request(app)
			.put("/api/auth/reset")
			.send({
				password: "asdasd123"
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Reset ID invalid.");
				done()
			})
	})
	
	it("only valid password and same repeated password", (done) => {
		chai.request(app)
			.put("/api/auth/reset")
			.send({
				password: "asdasd123",
				repeatedPassword: "asdasd123"
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Reset ID invalid.");
				done()
			})
	})
	
	it("invalid reset id, valid password and same repeated password", (done) => {
		chai.request(app)
			.put("/api/auth/reset")
			.send({
				rid: "427a90ccb74942b13683d85105f944d",
				password: "asdasd123",
				repeatedPassword: "asdasd123"
			})
			.end((err, res) => {
				res.should.have.status(401);
				res.body.should.property("message", "Reset ID invalid.");
				done()
			})
	})
	
	it("valid reset id, < 8 character password and diff repeated password", (done) => {
		chai.request(app)
			.put("/api/auth/reset")
			.send({
				rid: resetID,
				password: "asd",
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(3);
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.contain.an.item.with.property("msg", "Please enter the same password.");
				done()
			})
	})
	
	it("valid reset id, > 8 only character password and diff repeated password", (done) => {
		chai.request(app)
			.put("/api/auth/reset")
			.send({
				rid: resetID,
				password: "asdasdasd",
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(2);
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.contain.an.item.with.property("msg", "Please enter the same password.");
				done()
			})
	})
	
	it("valid reset id, > 8 only digits password and diff repeated password", (done) => {
		chai.request(app)
			.put("/api/auth/reset")
			.send({
				rid: resetID,
				password: "123123123",
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(2);
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.contain.an.item.with.property("msg", "Please enter the same password.");
				done()
			})
	})
	
	it("valid reset id, valid password and diff repeated password", (done) => {
		chai.request(app)
			.put("/api/auth/reset")
			.send({
				rid: resetID,
				password: "asdasd123",
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(1);
				res.body.errors.should.not.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.contain.an.item.with.property("msg", "Please enter the same password.");
				done()
			})
	})
	
	it("valid reset id, < 8 character password and same repeated password", (done) => {
		chai.request(app)
			.put("/api/auth/reset")
			.send({
				rid: resetID,
				password: "asd",
				repeatedPassword: "asd"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(2);
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Please enter the same password.");
				done()
			})
	})
	
	it("valid reset id, > 8 only character password and same repeated password", (done) => {
		chai.request(app)
			.put("/api/auth/reset")
			.send({
				rid: resetID,
				password: "asdasdasd",
				repeatedPassword: "asdasdasd"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(1);
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Please enter the same password.");
				done()
			})
	})
	
	it("valid reset id, > 8 only digit password and same repeated password", (done) => {
		chai.request(app)
			.put("/api/auth/reset")
			.send({
				rid: resetID,
				password: "123123123",
				repeatedPassword: "123123123"
			})
			.end((err, res) => {
				res.should.have.status(422);
				res.body.should.be.a("object");
				res.body.should.have.property("errors").be.a("array").to.have.lengthOf(1);
				res.body.errors.should.contain.an.item.with.property("msg", "Password must contain at least 8 characters, numbers, and letters.");
				res.body.errors.should.not.contain.an.item.with.property("msg", "Please enter the same password.");
				done()
			})
	})
	
	it("successful password reset", (done) => {
		chai.request(app)
			.put("/api/auth/reset")
			.send({
				rid: resetID,
				password: "asdasd123",
				repeatedPassword: "asdasd123"
			})
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.property("message", "Password resetted successfully.");
				done()
			})
	})
	
	it("successful login after password reset", (done) => {
		chai.request(app)
			.post("/api/auth/login")
			.send({
				email: "test@test.com",
				password: "asdasd123"
			})
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.property("message", "Logged in successfully");
				done()
			})
	})
})

describe("PUT /api/rooms/create", () => {
	it("empty create", (done) => {
		chai.request(app)
			.post("/api/rooms/create")
			.end((err, res) => {
				res.should.have.status(500);
				res.body.should.property("message", "Column \'roomId\' cannot be null");
				done()
			})
	})
	
	it("only roomId", (done) => {
		chai.request(app)
			.post("/api/rooms/create")
			.send({
				roomId: "1"
			})
			.end((err, res) => {
				res.should.have.status(500);
				res.body.should.property("message", "Column \'hostId\' cannot be null");
				done()
			})
	})
	
	it("successful room creation without url and capacity", (done) => {
		chai.request(app)
			.post("/api/rooms/create")
			.send({
				roomId: "1",
				hostId: userId
			})
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.property("message", "Room created...");
				done()
			})
	})
	
	it("successful room creation without capacity.", (done) => {
		chai.request(app)
			.post("/api/rooms/create")
			.send({
				roomId: "2",
				hostId: userId,
				url: "wwww.testing.com",
			})
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.property("message", "Room created...");
				done()
			})
	})
	
	it("successful room creation.", (done) => {
		chai.request(app)
			.post("/api/rooms/create")
			.send({
				roomId: "3",
				hostId: userId,
				url: "wwww.testing.com",
				capacity: "20"
			})
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.property("message", "Room created...");
				done()
			})
	})
})

describe("GET /api/rooms/:roomId", () => {
	it("invalid room", (done) => {
		chai.request(app)
			.get("/api/rooms/5")
			.end((err, res) => {
				res.should.have.status(500);
				res.body.should.property("message", "Room does not exist");
				done()
			})
	})
	
	it("valid room", (done) => {
		chai.request(app)
			.get("/api/rooms/3")
			.end((err, res) => {
				res.should.have.status(200);
				done()
			})
	})
})

describe("PUT /api/rooms/url", () => {
	it("invalid room", (done) => {
		chai.request(app)
			.put("/api/rooms/url")
			.send({
				roomId: "5"
			})
			.end((err, res) => {
				res.should.have.status(500);
				res.body.should.property("message", "Room does not exist");
				done()
			})
	})
	
	it("valid room", (done) => {
		chai.request(app)
			.put("/api/rooms/url")
			.send({
				roomId: "3",
				url: "www.test.com"
			})
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.property("message", "URL updated...");
				done()
			})
	})
})

describe("PUT /api/rooms/capacity", () => {
	it("invalid room", (done) => {
		chai.request(app)
			.put("/api/rooms/capacity")
			.send({
				roomId: "5"
			})
			.end((err, res) => {
				res.should.have.status(500);
				res.body.should.property("message", "Room does not exist");
				done()
			})
	})
	
	it("valid room, capacity > 15", (done) => {
		chai.request(app)
			.put("/api/rooms/capacity")
			.send({
				roomId: "3",
				capacity: "16"
			})
			.end((err, res) => {
				res.should.have.status(500);
				res.body.should.property("message", "Capacity is invalid");
				done()
			})
	})
	
	it("valid room, capacity <= 0", (done) => {
		chai.request(app)
			.put("/api/rooms/capacity")
			.send({
				roomId: "3",
				capacity: "-1"
			})
			.end((err, res) => {
				res.should.have.status(500);
				res.body.should.property("message", "Capacity is invalid");
				done()
			})
	})
	
	it("successful room capacity update", (done) => {
		chai.request(app)
			.put("/api/rooms/capacity")
			.send({
				roomId: "3",
				capacity: "1"
			})
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.property("message", "Capacity updated...");
				done()
			})
	})
})

describe("PUT /api/rooms/host", () => {
	it("invalid room", (done) => {
		chai.request(app)
			.put("/api/rooms/host")
			.send({
				roomId: "5",
			})
			.end((err, res) => {
				res.should.have.status(500);
				res.body.should.property("message", "Room does not exist");
				done()
			})
	})
	
	it("successful room host update", (done) => {
		chai.request(app)
			.put("/api/rooms/host")
			.send({
				roomId: "3",
				hostId: userId2,
			})
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.property("message", "Host updated...");
				done()
			})
	})
})

describe("DELETE /api/rooms/delete", () => {
	it("invalid room", (done) => {
		chai.request(app)
			.delete("/api/rooms/delete")
			.send({
				roomId: "5",
			})
			.end((err, res) => {
				res.should.have.status(500);
				res.body.should.property("message", "Room does not exist");
				done()
			})
	})
	
	it("invalid room", (done) => {
		chai.request(app)
			.delete("/api/rooms/delete")
			.send({
				roomId: "1",
			})
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.property("message", "Room deleted...");
				done()
			})
	})
})

describe("POST /api/rooms/join", () => {
	it("successful join", (done) => {
		chai.request(app)
			.post("/api/rooms/join")
			.send({
				roomId: "3",
				userId: userId
			})
			.end((err, res) => {
				res.should.have.status(200);
				done()
			})
	})
	
	it("full room", (done) => {
		chai.request(app)
			.post("/api/rooms/join")
			.send({
				roomId: "3",
				userId: userId2
			})
			.end((err, res) => {
				res.should.have.status(500);
				res.body.should.property("message", "Room is full..");
				done()
			})
	})
})

describe("PUT /api/rooms/settings", () => {
	it("can change settings", (done) => {
		chai.request(app)
			.put("/api/rooms/settings")
			.send({
				roomId: "3",
				users: [
					{
						userId: userId,
						roomId: "3",
						canVideo: false,
						canChat: false
					}
				]
			})
			.end((err, res) => {
				res.should.have.status(200);
				done()
			})
	})
})

describe("GET /api/rooms/:roomId/count", () => {
	it("successful get room count", (done) => {
		chai.request(app)
			.get("/api/rooms/3/count")
			.end((err, res) => {
				res.should.have.status(200);
				done()
			})
	})
})

describe("GET /api/rooms/:roomId/users", () => {
	it("successful get room users", (done) => {
		chai.request(app)
			.get("/api/rooms/3/users")
			.end((err, res) => {
				res.should.have.status(200);
				done()
			})
	})
})

describe("GET /api/rooms/:roomId/:userId", () => {
	it("successful get room userId", (done) => {
		chai.request(app)
			.get("/api/rooms/3/" + userId)
			.end((err, res) => {
				res.should.have.status(200);
				done()
			})
	})
})

describe("POST /api/rooms/disconnect", () => {
	it("wrong room", (done) => {
		chai.request(app)
			.post("/api/rooms/disconnect")
			.send({
				roomId: "5",
				userId: userId
			})
			.end((err, res) => {
				res.should.have.status(500);
				res.body.should.property("message", "Room or user does not exist");
				done()
			})
	})
	
	it("wrong user", (done) => {
		chai.request(app)
			.post("/api/rooms/disconnect")
			.send({
				roomId: "3",
				userId: userId2
			})
			.end((err, res) => {
				res.should.have.status(500);
				res.body.should.property("message", "Room or user does not exist");
				done()
			})
	})
	
	it("successfully disconnect", (done) => {
		chai.request(app)
			.post("/api/rooms/disconnect")
			.send({
				roomId: "3",
				userId: userId
			})
			.end((err, res) => {
				res.should.have.status(200);
				res.body.should.property("message", "User disconnected...");
				done()
			})
	})
})