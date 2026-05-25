const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // input validation
  const { full_name, email, password } = req.body;
  if(!full_name || !email || !password){
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // create user sql
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );
    `;
    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await sql`
      INSERT INTO users (full_name, email, password)
      VALUES (${full_name},${email}, ${hashedPassword})
      RETURNING id;
    `;
    return res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0]
    });
    
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }


};