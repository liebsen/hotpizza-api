const path = require("path")
const emailHelper = require('../email/helper')
const emailClient = emailHelper()

module.exports = {
  	getHome: (req, res) => {
  		return res.sendFile(path.join(`${__dirname}/../static/index.html`))
	},
	previewEmail:  (req, res) => {
		return res.sendFile(path.join(`${__dirname}/../email/template.html`))	
	},
	sendTestEmail: (req, res) => {
		emailClient.send({
			to:req.query.email,
			subject: 'Cuenta deshabilitada',
			data:{
				title:'¡Lo sentimos Mariano González!',
				message:'<p>Tu cuenta de proveedor fue deshabilitada temporalmente por incumplimiento de algunas de nuestras políticas de privacidad y/o términos y condiciones de uso.</p><p>En caso de considerarlo necesario, nuestro equipo de soporte se comunicará con usted para solucionarlo.</p>',
				link: process.env.APP_URL + '/como-funciona',
				linkText:'Conocer mas acerca de Festive',
				tag: 'cliente'
			},
			templatePath:path.join(__dirname,'/../email/template.html')
		}).catch(function(err){
			if(err) console.log(err)
		}).then(function(){
			res.status(200).send({ status: 'success' });
		})
	}
}
