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
                r.location,
                r.email,
                r.phone,
                r.opening_hours,
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
            SELECT id, name, location, delivery_zone, opening_hours 
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


router.post("/order", async (req, res) => {
    console.log("Request Body:", JSON.stringify(req.body, null, 2));

    const { customerId, restaurantId, price, items } = req.body;

    if (!items || items.length === 0) {
        console.log("Order failed: Cart is empty");
        return res.status(400).json({ error: "Cart is empty" });
    }
    const client = await pool.connect();

    try {
        await client.query('BEGIN');


        const orderQuery = `
            INSERT INTO orders (customer_id, restaurant_id, status_id, price)
            VALUES ($1, $2, 1, $3)
                RETURNING id
        `;
        const orderResult = await client.query(orderQuery, [customerId, restaurantId, price]);
        const newOrderId = orderResult.rows[0].id;

        const dishQuery = `
            INSERT INTO o_dishes (order_id, dish_id, ammount)
            VALUES ($1, $2, $3)
        `;
        for (const item of items) {
            await client.query(dishQuery, [newOrderId, item.id, item.quantity]);
        }
        await client.query('COMMIT');
        res.status(201).json({ message: "Order placed successfully", orderId: newOrderId });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error placing order:", err);
        res.status(500).json({ error: "Server error processing order" });
    } finally {
        client.release();
    }
});

router.get("/order/status/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT
                o.id,
                os.name as status,
                o.delivery_time
            FROM orders o
                     JOIN o_status os ON o.status_id = os.id
            WHERE o.id = $1
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }

        const row = result.rows[0];

        res.json({
            success: true,
            order: {
                id: row.id,
                status: row.status,
                deliveryTime: row.delivery_time
            }
        });

    } catch (err) {
        console.error("Error fetching order status:", err);
        res.status(500).json({ error: "Server error" });
    }
});


export default router;