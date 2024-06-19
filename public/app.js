import express from "express";
import session from "express-session";
import { MongoClient } from "mongodb";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import bodyParser from "body-parser";

const uri = "mongodb://localhost:27017/";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const client = new MongoClient(uri);
const dbname = "admin";

const StudentInfo = client.db(dbname).collection("Student");
const ResultInfo = client.db(dbname).collection("Result");
const AttendanceInfo = client.db(dbname).collection("Attendence");
const Timetable = client.db(dbname).collection("Timetable");

async function connectToDatabase() {
  try {
    await client.connect();
    console.log(`Connected to the ${dbname} database.`);
  } catch (err) {
    console.log(`Error connecting to the database: ${err}`);
    throw err;
  }
}

connectToDatabase();

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

app.get("/", async (req, res) => {
  try {
    res.render("index.ejs");
  } catch (err) {
    console.error(`Error: ${err}`);
    res.send(res.status);
  }
});

app.post("/result", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await StudentInfo.findOne({ "Username": email, "Password": password });
    if (user) {
      req.session.user = user;
      res.redirect("/result");
    } else {
      res.render("index.ejs", { error: "Enter a valid Username and Password" });
    }
  } catch (err) {
    console.error(`Error: ${err}`);
    res.send(res.status);
  }
});

const requireLogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/");
  }
};


app.get("/login", async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(`Error destroying session: ${err}`);
    }
    res.redirect("/");
  });
});

app.get("/result", requireLogin, async (req, res) => {
  try {
    const user = await ResultInfo.findOne({ "Username": req.session.user.Username });

    res.render("result-1.ejs", { student: user.Result[0].Report });
  } catch (err) {
    console.error(`Error: ${err}`);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/result1", requireLogin, async (req, res) => {
  try {

    const user = await ResultInfo.findOne({ "Username": req.session.user.Username });

    res.render("result-1.ejs", { student: user.Result[0].Report });
  } catch (err) {
    console.error(`Error: ${err}`);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/result2", requireLogin, async (req, res) => {
  try {

    const user = await ResultInfo.findOne({ "Username": req.session.user.Username });

    res.render("result-2.ejs", { student: user.Result[1].Report });
  } catch (err) {
    console.error(`Error: ${err}`);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/result3", requireLogin, async (req, res) => {
  try {
    

    const user = await ResultInfo.findOne({ "Username": req.session.user.Username });

    res.render("result-3.ejs", { student: user.Result[2].Report });
  } catch (err) {
    console.error(`Error: ${err}`);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/attendence", requireLogin, async (req, res) => {
  try {
    

    const user=await AttendanceInfo.findOne({"_id":req.session.user.Password});
    res.render("attendence.ejs", { student: user.AttendanceReview });
  } catch (err) {
    console.error(`Error: ${err}`);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/details/:id",requireLogin,async (req,res)=>{
  try{

    const subidx=req.params.id;
    const user=await AttendanceInfo.findOne({"_id":req.session.user.Password});
    res.render("details.ejs", { AttendanceDetails : user.AttendanceReview[subidx].Details});
  }
  catch(err){
    console.error("Error : "+err);
    res.status(500).send("Internal Server Error");
  }
})

app.get("/timetable", requireLogin, async (req, res) => {
  try {
    

    const userDivsion = req.session.user.GenInfo.Division;
    const user = await Timetable.findOne({ "_id": userDivsion });
    res.render("timetable.ejs", { student: user });

  } catch (err) {
    console.error(`Error: ${err}`);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/profile", requireLogin, async (req, res) => {
  try {
    

    let user = await StudentInfo.findOne({ "Username": req.session.user.Username });
    res.render("profile.ejs", { student: user, Address: user.PersonalInfo.Address  });
  } catch (err) {
    console.error(`Error: ${err}`);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/editPersonalInfo", requireLogin, async (req, res) => {
  try {
    

    const user = await StudentInfo.findOne({ "Username": req.session.user.Username });
    res.render("edit_personalInfo.ejs", { student: user.PersonalInfo });

  } catch (err) {
    console.error(`Error: ${err}`);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/editBankDetails", requireLogin, async (req, res) => {
  try {
    
    const user = await StudentInfo.findOne({ "Username": req.session.user.Username });
    res.render("edit_BankDetails.ejs", { student: user.BankInfo });
  } catch (err) {
    console.error(`Error: ${err}`);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/editPersonalInfo", async (req, res) => {
  try {
    
    let PersonalInfo = req.session.user.PersonalInfo;
    let Address=PersonalInfo.Address;
    let Name=PersonalInfo.Name;
    let updatedData = req.body;

    let address = {};

    for (let key in updatedData) {
      if (['FlatNo', 'Society', 'Street', 'City', 'Pin', 'State', 'Country'].includes(key)) {
        address[key] = updatedData[key];
        delete updatedData[key];
      }
    }

    updatedData.Address=address;
    updatedData.Name=`${req.body.FirstName} ${req.body.MiddleName} ${req.body.LastName}`;
    
    console.log(updatedData);
    let result=await StudentInfo.updateOne({"Username":req.session.user.Username},{$set:{PersonalInfo : updatedData}});
    req.session.user=await StudentInfo.findOne({"Username":req.session.user.Username});
    res.redirect("/profile");
  } catch (err) {
    console.error(`Error : ${err}`);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/editBankDetails", async (req, res) => {
  try {
    

    let BankInfo = req.session.user.BankInfo;["Bank"]
    let updatedData = req.body;

    let result = await StudentInfo.updateOne({ "Username": req.session.user.Username }, { $set: { BankInfo: updatedData } });
    req.session.user = await StudentInfo.findOne({ "Username": req.session.user.Username });
    res.redirect("/profile");
  } catch (err) {
    console.error(`Error : ${err}`);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
