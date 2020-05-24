const express = require("express")
const router = express.Router()
const home = require("../controllers/home")
const upload = require("../controllers/upload")
const register = require("../controllers/register")
const application = require("../controllers/application")
const panel = require("../controllers/panel")
const admin = require("../controllers/admin")
const payments = require("../controllers/payments")
const collection = require("../controllers/collection")
const embedded = require("../controllers/embedded")
const auth = require("../controllers/auth")

let routes = app => {
	
	/* Public */	
	/* api.festive.com.ar */

	router.get("/", home.getHome)
	router.get("/send-email", home.sendTestEmail)
	router.get("/preview-email", home.previewEmail)

	/* solicitudes.festive.com.ar */
	router.get("/registro/data", register.data)
	router.post("/registro/solicitar", register.register)
	
	/* app */
	router.get('/noticias', application.blog.listing)
	router.post('/noticias/buscar', application.blog.search)
	router.get('/noticias/:slug', application.blog.category)
	router.get('/noticias/:slug/:sslug', application.blog.entry)
	router.post('/iconclick', application.iconclick)
	router.post('/contacto', application.contact)
	router.put('/consultar/:id*?', application.request)
	router.get('/seccion/:slug*?', application.section)
	router.get('/buscar/:que/:donde', application.search)
	router.get('/proveedor/:id', application.provider)
	router.get('/app/data', application.data)

	/* panel */
	router.get('/panel/data', panel.data)
	router.post('/panel/login', panel.login)
	router.post('/panel/restore_password', panel.restore_password)
	router.post('/panel/update_password', panel.update_password)
	router.post('/panel/validate_code', panel.validate_code)
	router.post('/panel/crear_cuenta', panel.create)
	router.get('/panel/solicitudes', auth.check, panel.requests)
	router.post('/panel/responder/:id', auth.check, panel.respond)
	router.post('/panel/token', auth.check, panel.token)
	router.get('/panel/proveedor', auth.check, panel.provider)
	router.post('/panel/baja', auth.check, panel.downgrade)
	router.post('/panel/modificar_contrasena', auth.check, panel.change_password)
	router.post('/mercadopago/preferencia', auth.check, payments.preference)
	router.post('/mercadopago/notificacion', payments.notification)
	router.post('/procesar-pago', payments.procesar_pago)

	/* admin */
	router.post('/login', auth.login)
	router.post('/token', auth.check, auth.token)
	router.post('/admin/create_account', admin.create_account)
	router.post('/admin/restore_password', admin.restore_password)
	router.post('/admin/update_password', admin.update_password)
	router.post('/admin/change_password', auth.check, admin.change_password)
	router.post('/admin/searchall', auth.check, admin.searchall)
	router.post('/admin/proveedores/aprobar', auth.check, admin.approve)
	router.post('/admin/proveedores/desaprobar', auth.check, admin.disapprove)

	/* Private */
	/* files */
	
	router.get(
		'/upload/list',
		auth.check,
		upload.getFiles
	)

	router.post(
		'/upload/delete',
		auth.check,
		upload.deleteFile
	)

	router.post(
		'/upload/multi',
		auth.check,
		upload.uploadFiles,
		upload.resizeImages,
		upload.getResult
	)

	/* actions performed on properties */
	router.get('/:c', auth.check, collection.list)
	router.get('/:c/search', auth.check, collection.search)
	router.get('/:c/like', auth.check, collection.like)
	router.get('/:c/:id', auth.check, collection.item)
	router.put('/:c', auth.check, collection.create)
	router.post('/:c/:id', auth.check, collection.update)
	router.delete('/:c/:id', auth.check, collection.delete)

	/* actions performed on embedded objects */
	router.get('/:c/search/:s', auth.check, embedded.search)
	router.get('/:c/like/:s', auth.check, embedded.like)
	router.get('/:c/:id/:s', auth.check, embedded.list)
	router.get('/:c/:id/:s/:sid', auth.check, embedded.item)
	router.put('/:c/:id/:s', auth.check, embedded.create)
	router.post('/:c/:id/:s', auth.check, embedded.push)
	router.post('/:c/:id/:s/:sid', auth.check, embedded.update)
	router.delete('/:c/:id/:s/:sid', auth.check, embedded.delete)


	return app.use("/", router)
}

module.exports = routes