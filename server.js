const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// PostgreSQL Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Initialize Database Tables
async function initializeDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS news (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                category VARCHAR(50) NOT NULL,
                media_url TEXT NOT NULL,
                media_type VARCHAR(10) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                keywords TEXT[]
            );

            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL
            );
        `);
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

initializeDatabase();

// Routes
app.get('/api/news', async (req, res) => {
    try {
        const { sort, category, keyword } = req.query;
        let query = `
            SELECT * FROM news
            WHERE 1=1
        `;
        const values = [];

        if (category) {
            values.push(category);
            query += ` AND category = $${values.length}`;
        }

        if (keyword) {
            values.push(keyword);
            query += ` AND $${values.length} = ANY(keywords)`;
        }

        if (sort === 'oldest') {
            query += ' ORDER BY created_at ASC';
        } else {
            query += ' ORDER BY created_at DESC';
        }

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/news', async (req, res) => {
    try {
        const { title, content, category, mediaUrl, mediaType, keywords } = req.body;
        const result = await pool.query(
            `INSERT INTO news (title, content, category, media_url, media_type, keywords)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [title, content, category, mediaUrl, mediaType, keywords]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating news:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching article:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/news/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM news WHERE id = $1', [id]);
        res.json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
