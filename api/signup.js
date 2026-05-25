const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  // ⚡ CORS পলিসি হ্যান্ডেল করার জন্য এই হেডারগুলো যোগ করা হলো
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // সব ধরণের ডিভাইস থেকে রিকোয়েস্ট অ্যালাউ করবে
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // যদি মোবাইল বা ব্রাউজার থেকে প্রি-ফ্লাইট (OPTIONS) রিকোয়েস্ট আসে, তবে সরাসরি ২০০ রেসপন্স পাঠানো
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // শুধু POST রিকোয়েস্ট অ্যালাউ করা হবে
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    // ✨ ট্রিক: টেবিল না থাকলে এই কোডটি নিজে থেকেই টেবিল তৈরি করে নেবে!
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `;

    // পাসওয়ার্ড লক করা
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // ডেটা ইনসার্ট করা
    const result = await sql`
      INSERT INTO users (email, password) 
      VALUES (${email}, ${hashedPassword}) 
      RETURNING id, email;
    `;
    
    return res.status(201).json({ message: "Registration Successful!", user: result.rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Database error" });
  }
};