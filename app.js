// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

// Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
});
app.use(limiter);
app.use(helmet());
app.use(express.json());
app.use(cors());

// ✅ MongoDB connection
async function connection() {
  const mongoURI = process.env.MONGODBURL;
  if (!mongoURI) {
    console.error("❌ MONGODBURL is not defined in environment variables!");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

// 🔧 Schemas and Models

// Product schema
const productschema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  image: { type: String, required: true }
});
const productmodel = mongoose.model('products', productschema);

// User schema
const userschema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true }
});
const usermodel = mongoose.model('users', userschema);

// ✅ Routes

// Health check
app.get('/', (req, res) => {
  res.send("Server is active");
});

// Query example
app.get('/userdetails', (req, res) => {
  const { age, location } = req.query;
  res.json({
    message: `This person is ${age} years old and lives in ${location}.`
  });
});

// Add product
app.post('/products', async (req, res) => {
  try {
    const { name, price, image, qty } = req.body;
    await productmodel.create({ name, price, image, qty });
    res.status(201).json({ message: "Product Added Successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all products
app.get('/products', async (req, res) => {
  try {
    const products = await productmodel.find();
    res.status(200).json({ products });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product
app.delete('/product', async (req, res) => {
  try {
    const { _id } = req.body;
    await productmodel.findByIdAndDelete(_id);
    res.json({ message: "Product Deleted Successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update product
app.put('/products', async (req, res) => {
  try {
    const { _id, name } = req.body;
    await productmodel.findByIdAndUpdate(_id, { name }, { new: true });
    res.json({ message: "Product Updated Successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Register user
app.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    const existingUser = await usermodel.findOne({ username });
    if (existingUser) return res.json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await usermodel.create({
      username,
      password: hashedPassword,
      email
    });

    // Send welcome email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Welcome to the App!',
      html: `<h2>Hello ${username}, welcome to our service!</h2>`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Registration Successful" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login user
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await usermodel.findOne({ username });
    if (!user) return res.json({ message: "User not found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { user: username },
      process.env.JWT_SECRET || "defaultsecretkey",
      { expiresIn: '1h' }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Optional: Hashing test function
async function hashing() {
  const password = "PROFESSOR@123";
  const finalpassword = await bcrypt.hash(password, 5);
  console.log("Sample hash:", finalpassword);
}

// Start the server
app.listen(port, async () => {
  console.log(`🚀 Server running on port ${port}`);
  await connection();
  hashing();
});
