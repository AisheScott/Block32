const pg = require("pg");
const express = require ("express");
const morgan = require ("morgan");

const client = new pg.Client(
    process.env.DATABASE_URL || "postgresql://postgres:Kortney11@localhost:5432/acme_ic_db"
  );

const server = express ();

async function init () {
    await client.connect();
    console.log('connect to database')

    let SQL = 
        `DROP TABLE IF EXISTS flavors;
        CREATE TABLE flavors (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            is_favorite BOOLEAN DEFAULT False NOT NULL,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        );
    `;

    await client.query(SQL)
    console.log("tables created");

    SQL =`
        INSERT INTO flavors(name, is_favorite) VALUES('Vanilla', true);
        INSERT INTO flavors(is_favorite, name) VALUES(false, 'Chocolate');
        INSERT INTO flavors(name) VALUES('Swirl');
    `;

    await client.query(SQL);
    console.log("data seeded");
    const port = process.env.PORT || 3000;
    server.listen(port, () => console.log(`listening on port ${port}`));
}

init ();

server.use(express.json()); 
server.use(require("morgan")("dev")); 

//endpoints CRUD
//C - CREATE --> POST
//R - READ --> GET
//U - UPDATE --> PUT
//D - DELETE --> DELETE

//CREATE - adds a new flavor to the table
server.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `INSERT INTO flavors(name) VALUES($1) RETURNING *;`;
    const response = await client.query(SQL, [req.body.name]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//READ - returns an array of flavors objects
server.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors ORDER BY created_at DESC;`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//READ - returns the flavor with matching id
server.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors WHERE id=$1;`;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

//UPDATE - edits a flavor
server.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `UPDATE flavors SET name=$1, is_favorite=$2, updated_at=now() WHERE id=$3 RETURNING *;`;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

//DELETE
server.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE FROM flavors WHERE id=$1;`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

