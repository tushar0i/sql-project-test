const express = require("express");
const app = express();
app.use(express.json());
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config({ quiet: true });
const dbUrl = process.env.DATABASE_URL;
const port = process.env.PORT;
const salt = Number(process.env.SALT);

const pool = new Pool({
    connectionString: dbUrl,
});

app.post("/api/v1/user/signup", async (req, res) => {
    try {
        const { email, password, name, bio, dob, gender } = req.body;
        const balance = (Math.random() * 2500 + 500).toFixed(2);

        const exist = await pool.query(
            `SELECT email FROM users WHERE email = $1`,
            [email],
        );
        // console.log(exist)
        if (exist.rowCount == 1) {
            return res.json({
                message: "user already exist try sigining in",
            });
        }

        const hpass = await bcrypt.hash(password, salt);

        const user = await pool.query(
            `INSERT INTO users (email,password,name,bio,dob,balance,gender) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [email, hpass, name, bio, dob, balance, gender],
        );
        // console.log(user.rows[0]);

        return res.json({
            id: user.rows[0].id,
            message: "Sign up successfully",
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

app.get("/api/v1/user/signin", async (req, res) => {

    try {

        const { email, password } = req.body;
        const user = await pool.query(`SELECT * FROM users WHERE email = $1`, [email])
        if (user.rowCount == 0) {
            return res.json({
                message:"user not found"
            })
        }
        const hpass = user.rows[0].password;
        const match = await bcrypt.compare(password, hpass)
        if (!match) {
            return res.json({
                message:"Incorrect password"
            })
        }
        return res.json({
            message: "Sign In successfully",
        });
        
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internal server error"
        })
    }
    
});

app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
});
