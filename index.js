const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors")
const { connection } = require("./config/db");
const { UserModel } = require("./models/User.modal");
const { blogRouter } = require("./routes/blogroute");
const { authentication } = require("./middlewares/authentication");
require("dotenv").config()
const app = express();
app.use(cors({
  origin:"*"
}))
app.use(express.json());

app.get("/", (req, res) => {
  res.send("base api");
});

app.post("/signup", async (req, res) => {
  let { name, email, password } = req.body;
  bcrypt.hash(password, 3, async function (err, hash) {
    const new_user = new UserModel({
      name,
      email,
      password: hash,
    });
    try {
      await new_user.save();
      res.send({msg:"signup successful"});
    } catch (error) {
      console.log(err);
      res.status(500).send({msg:"something went wrong"});
    }
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email });
 
  if (!user) {
    res.send("signup first");
  } else {
    const hash_password = user.password;
    console.log(hash_password)
    bcrypt.compare(password, hash_password, function (err, result) {
      if (result) {
        let token = jwt.sign({ user_id: user._id }, process.env.SECRET_KEY);
        res.send({ msg: "login successful", token: token });
      } else {
        res.send({msg:"login failed"});
      }
    });
  }
});

app.use("/blogs", authentication, blogRouter);

app.listen(8080, async () => {
  try {
    await connection;
    console.log("connected to DB Successfully");
  } catch (err) {
    console.log("Error while connecting to DB");
    console.log(err);
  }
  console.log("listening on port 8080");
});
