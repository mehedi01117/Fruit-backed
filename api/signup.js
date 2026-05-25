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

  // ⚡ পরিবর্তন: এবার বডি থেকে email, password এর সাথে name-ও নেওয়া হচ্ছে
  const { name, email, password } = req.body;

  try {
    // টেবিল তৈরি করার সময়ও name কলাম যুক্ত রাখা হলো (ভবিষ্যতের জন্য)
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `;

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // ⚡ পরিবর্তন: ডেটাবেজে এবার name-ও ইনসার্ট করা হচ্ছে
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