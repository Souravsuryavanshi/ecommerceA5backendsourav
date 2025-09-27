// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const cors=require('cors')
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const helmet=require('helmet')
const dotenv=require('dotenv');
const jwt=require('jsonwebtoken')
const nodemailer=require('nodemailer')
dotenv.config()
const app = express();
const port = process.env.PORT;

// Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  ipv6Subnet: 56
});
app.use(limiter);
app.use(helmet)
app.use(express.json());
app.use(cors())
// MongoDB nnection
async function connection() {
  await mongoose.connect(process.env.MONGODBURL)
  console.log(process.env.MONGODBURL)
}

// Product schema
let productschema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  image: { type: String, required: true }
});
let productmodel = mongoose.model('products', productschema);

// User schema
let userschema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true }
});
let usermodel = mongoose.model('users', userschema);

// API 1: Status check
app.get('/', function (req, res) {
  res.send("Server is active");
})

app.get ('/userdetails',function(req,res){
  let age=req.query.age;
  let location=req.query.location;
  
  res.json({
    message:`this person age is ${age} and his/her location is${location}`
  })
})

// API 2: Add product
app.post('/products', async function (req, res) {
  try {
    const { name, price, image, qty } = req.body;
    await productmodel.create({ name, price, image, qty });
    res.status(201).json({ message: "Product Added Successfully" });
  } catch (error) {
    res.json({ message: error.message });
  }
});

// API 3: Fetch products
app.get('/products', async function (req, res) {
  try {
    let products = await productmodel.find();
    res.status(200).json({ products });
  } catch (error) {
    res.json({ message: error.message });
  }
});

// Hashing demo
async function hashing() {
  let password = "PROFESSOR@123";
  let finalpassword = await bcrypt.hash(password, 5);
  console.log(finalpassword);
}

// API 4: Delete product
app.delete('/product', async function (req, res) {
  try {
    const { _id } = req.body;
    await productmodel.findByIdAndDelete(_id);
    res.json({ message: "Product Deleted Successfully" });
  } catch (error) {
    res.json({ message: error.message });
  }
});

// API 5: Update product
app.put('/products', async function (req, res) {
  try {
    const { _id, name } = req.body;
    await productmodel.findByIdAndUpdate(_id, { name }, { new: true });
    res.json({ message: "Product Updated Successfully" });
  } catch (error) {
    res.json({ message: error.message });
  }
});

// API 6: Register user
app.post('/register', async function (req, res) {
  try {
    const { username, password, email } = req.body;
    let user = await usermodel.findOne({ username });
    if (user) return res.json({ message: "User already exists" });

    let hashpassword = await bcrypt.hash(password, 10);
    let finaluser=await usermodel.create({username,password:hashpassword,email});
    await (await finaluser).save()
    let transporter=nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

const mailOptions={
    from: process.env.GMAIL_USER,
    to: 'chrohankumar8504@gmail.com',
    subject: 'test email from gmail',
    text: 'ya buddy light wieght  light wieght baby ',
    html:`
    <h2>hello from sourav!</h2>
    `
};

console.log('sending email....');

transporter.sendMail(mailOptions);

    res.json({ message: 'Registration Successful' });
  } catch (error) {
    res.json({ message: error.message });
  }
});

app.post('/login',async function(req,res){
  try{
    const{username,password}=req.body;
    let user=usermodel.findOne({username})
    
    if(!user)return res.json({message:"user not found"})
      let authuser=bcrypt.compare(password,user.password);
    if(!authuser)return res.json({message:"invalid credentials"})
      let secret=sourav143
Jwt.sign({}.Secret,{})
jwt.sign({user:username}.secret,{expireIn:'1hr'})
if(!token)return res.json({
  message:"token is required"
})
    
      res.json({message:"login successful"})
  }catch(error) {
    res.json({
      message:error.message
    })

  }

})



// Start server
app.listen(port, async function () {
  console.log(`Server running on port ${port}`);
  await connection();
  console.log('DB CONNECTED');
  hashing();
});
