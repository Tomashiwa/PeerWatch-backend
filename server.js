const express = require("express");
const app = express();

const users = require("./routes/api/users");

app.use(express.json());
app.use("/api/users", users);

app.listen("3000", () => {
    console.log("Server started on port 3000...");
})