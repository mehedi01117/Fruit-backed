const {sql} = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

module.exports = async (req, res) => {
    // 
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if(req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    // database connection
    const { email, password } = req.body;
    if(!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // data from database
        const result = await sql`
            SELECT * FROM users WHERE email = ${email}
        `;
        // user not found
        if(result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];
        // password check
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
    } catch (error) {
        console.error(error);
    }
    return res.status(500).json({ error: 'Internal server error' });
}
