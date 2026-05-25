const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
  // CORS হেডারস
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password } = req.body;

  try {
    // 💥 ১. পুরোনো টেবিলটি প্রথমে জোর করে ডিলিট করা হচ্ছে
    await sql`DROP TABLE IF EXISTS users;`;

    // 🆕 ২. এবার নতুন করে name কলামসহ টেবিলটি তৈরি করা হচ্ছে
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `;

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // ৩. ডেটা ইনসার্ট করা
    const result = await sql`
      INSERT INTO users (name, email, password) 
      VALUES (${name}, ${email}, ${hashedPassword}) 
      RETURNING id, name, email;
    `;
    
    return res.status(201).json({ message: "Registration Successful!", user: result.rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Database error" });
  }
};