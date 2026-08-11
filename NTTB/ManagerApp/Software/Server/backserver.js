const express = require('express');
const app = express();

//Database
const mariadb = require('mariadb');

const pool = mariadb.createPool({
	host: '127.0.0.1',
	user: 'AaronDustin',
	password: '12345',
	database: 'ntdb',
	connectionLimit: 5
});

var returnResponse = '';
var jsonRows = '';
/////////////////////////
// GetUsers will get all users from mariadb 
// MockDB database, json the data and send it
////////////////////////
async function getUsers(){ 
	let conn;
	let data;
	try{
		conn = await pool.getConnection();
		const rows = await conn.query("SELECT * FROM Users");
		console.log(rows);
		jsonRows = JSON.stringify(rows, null, 2);
		console.log(jsonRows);
		returnResponse = rows;
	// turn
	} catch (err) {
		console.error('DB error. ', err);
	} finally {
		if (conn) conn.release();
	}
}
async function getUsersID(id){
	console.log("id = " , id);
	let conn;
	let data;
	try{
		conn = await pool.getConnection();
		const rows = await conn.query(`SELECT * FROM Users WHERE user_id = ${id}`);
		data = JSON.stringify(rows);
		console.log(rows[0]['user_name']);
		return data;
	} catch (err){
		console.log('DB error. ', err);
		return "Error"
	} finally {
		if (conn) conn.release();
	}
}


async function getData() {
	let conn;
	try {
		conn = await pool.getConnection();
		const rows = await conn.query("SELECT * FROM Users");
		console.log(rows);
		returnResponse += rows[0]['user_name'];
	} catch (err) {
		console.error('DB error. ', err);
	} finally {
		if (conn) conn.release();
	}
}


async function createData() {
	let conn;
	try {
		conn = await pool.getConnection();
		const log = conn.query("insert into Users values (5,3,'another new username',0,0)");
		console.log(log);
		returnResponse += log;
	} catch (err) {
		console.error('DB error. ', err);
	} finally {
		if (conn) conn.release();
	}
}


//getData();
//getUsers();
//createData();

app.get('/talktome', (req, res) => res.send(returnResponse));
app.get('/users/:id', async (req, res) => res.send(await getUsersID(req.params.id)));
app.get('/users', (req, res) => res.send(jsonRows));
app.listen(9001, () => console.log('Server running on port 9001'));
