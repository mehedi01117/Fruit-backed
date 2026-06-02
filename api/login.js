const { sql } = require("@vercel/postgres");
const bcrypt = require("bcryptjs");

module.exports = async (req, res) => {
  // CORS Headers (Cross-Origin Resource Sharing)
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Preflight request handling
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // শুধুমাত্র POST রিকোয়েস্ট অ্যালাউ করা হবে
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // রিকোয়েস্ট বডি থেকে ডাটা নেওয়া
  const { email, password } = req.body;

  // ইমেইল বা পাসওয়ার্ড খালি থাকলে এরর দেওয়া
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // ১. ডাটাবেজ থেকে এই ইমেইলের ইউজারকে খুঁজে বের করা
    const result = await sql`
      SELECT * FROM users WHERE email = ${email.trim()}
    `;
    
    // যদি ওই ইমেইলে কোনো ইউজার না পাওয়া যায়
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    
    // ২. ইনপুট দেওয়া পাসওয়ার্ডের সাথে ডাটাবেজের হ্যাশ পাসওয়ার্ড ম্যাচ করা
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    // পাসওয়ার্ড না মিললে এরর দেওয়া
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // 🎉 ৩. সবকিছু ঠিক থাকলে সফল লগইন রেসপন্স পাঠানো
    return res.status(200).json({
      message: "Login successful!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    // ডাটাবেজ কানেকশন বা কুয়েরিতে কোনো ভুল হলে তা কনসোলে প্রিন্ট হবে
    console.error("Database or Server Error:", error);
    
    // প্রকৃত এরর মেসেজসহ ৫০০ স্ট্যাটাস পাঠানো
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};