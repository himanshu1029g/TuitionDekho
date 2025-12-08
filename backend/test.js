const express = require("express")
const cors = require("cors")
const connectDB = require('./config/database');

require("dotenv").config();
const app = express();

const PORT = process.env.PORT || 7000;
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/students', require('./routes/students'));
app.use('/api/meetings', require('./routes/meetings'));

// Health check route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Server is running!' });
    console.log("server is working .well babes  ")
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});








// console.log("PORT from env:", process.env.PORT);
// app.get("/",(req,res)=>{
//     res.json({message: "test server is working!"})
// });



// app.listen(PORT,()=>{
//     console.log(`Test server is running on port ${PORT}`)
// })