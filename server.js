const path = require('path')
const express = require("express")
const app = express()
const bodyParser = require('body-parser')
const mongodb = require('mongodb')
const cors = require('cors')
const mercadopago = require ('mercadopago')
const initRoutes = require("./routes/web")
const initCron = require("./cron")
const allowedOrigins = [
	'http://0.0.0.0:8000',
	'http://localhost:8080',
	'https://admin.hotpizza.com',
	'https://hotpizza.com',
	'https://api.hotpizza.com'
]

mercadopago.configure({
  //sandbox: true,
  access_token: process.env.MP_TOKEN
})

app.set('etag', false)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ type: 'application/json' }))
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'static')))
app.use(function(req, res, next) {
	res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
	res.header("Access-Control-Allow-Origin", "*") // update to match the domain you will make the request from
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
	next()
})

app.use(cors({
	origin: function(origin, callback){
		// allow requests with no origin 
		// (like mobile apps or curl requests)
		if(!origin) {
			console.log("not allowed origin to unknown")
			return callback(null, true)
		}
		if(allowedOrigins.indexOf(origin) === -1){
			var msg = 'The CORS policy for this site does not ' +
				'allow access from the specified Origin: ' + origin
			return callback(new Error(msg), false)
		}
		return callback(null, true)
	}
}))

mongodb.MongoClient.connect(process.env.MONGO_URL, { useUnifiedTopology: true, useNewUrlParser: true }, function(err, database) {
	if(err) throw err
	const db = database.db(process.env.MONGO_URL.split('/').reverse()[0])
	const port = process.env.PORT||3000

	app.db = db

	initRoutes(app)
	initCron(db)

	app.listen(port, () => {
	  console.log(`Server running at https://localhost:${port}`)
	})
})
