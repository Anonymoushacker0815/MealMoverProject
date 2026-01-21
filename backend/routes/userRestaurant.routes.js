import express from "express";
import { pool } from '../db.js';

const router = express.Router();

// GET: All restaurants
router.get("/", async (req, res) => {
    try {
        const query = `
            SELECT
                r.id,
                r.name,
                r.delivery_zone,
                COUNT(rev.id) as review_count,
                COALESCE(AVG(rev.rating), 0)::numeric(10,1) as average_rating
            FROM restaurants r
                     LEFT JOIN reviews rev ON r.id = rev.restaurant_id
            GROUP BY r.id
            ORDER BY average_rating DESC
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching restaurants:", err);
        res.status(500).json({ error: "Server error" });
    }
});



// GET: distinct categories
router.get("/categories", async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT name 
            FROM categories 
            ORDER BY name ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// GET: Restaurant Menu with Categories and Dishes
router.get("/:id/menu", async (req, res) => {
    const { id } = req.params;
    try {

        const restaurantQuery = `
            SELECT id, name, delivery_zone, opening_hours 
            FROM restaurants WHERE id = $1
        `;
        const restResult = await pool.query(restaurantQuery, [id]);

        if (restResult.rows.length === 0) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        const menuQuery = `
            SELECT 
                c.id as category_id,
                c.name as category_name,
                d.id as dish_id,
                d.name as dish_name,
                d.description,
                d.price::numeric as price, 
                d.picture_path
            FROM categories c
            LEFT JOIN r_dishes d ON c.id = d.category_id
            WHERE c.restaurant_id = $1
            ORDER BY c.name, d.name
        `;

        const menuResult = await pool.query(menuQuery, [id]);
        
        const categoriesMap = new Map();

        menuResult.rows.forEach(row => {
            if (!categoriesMap.has(row.category_id)) {
                categoriesMap.set(row.category_id, {
                    id: row.category_id,
                    name: row.category_name,
                    items: []
                });
            }

            if (row.dish_id) {
                categoriesMap.get(row.category_id).items.push({
                    id: row.dish_id,
                    name: row.dish_name,
                    description: row.description,
                    price: parseFloat(row.price),
                    image: row.picture_path
                });
            }
        });

        res.json({
            restaurant: restResult.rows[0],
            menu: Array.from(categoriesMap.values())
        });

    } catch (err) {
        console.error("Error fetching menu:", err);
        res.status(500).json({ error: "Server error" });
    }
});



export default router;