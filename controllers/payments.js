const mercadopago = require ('mercadopago')
var axios = require('axios')
const emailHelper = require('../email/helper')
const emailClient = emailHelper()
const moment = require('moment')
const ObjectId = require('mongodb').ObjectId

module.exports = {
  preference: (req, res, next) => {
    // Crea un objeto de preferencia
    let iva_coef = 0.21;
    req.app.db.collection('planes').findOne({
      slug: req.body.plan
    },function(err, plan) {

      if (err) return res.status(500).send('Error on the server.')
      if (!plan) return res.status(404).send('No plan found.')

      req.app.db.collection('proveedores').findOne({
        _id: new ObjectId(req.decoded.id)
      },function(err, proveedor) {

        if (err) return res.status(500).send('Error on the server.')
        if (!proveedor) return res.status(404).send('No account found.')

        let iva = 0;
        let precio = parseFloat(plan.precio)
        let vence = moment().add(1, 'months').format()

        if(!plan.iva) {
          iva = Math.round(plan.precio * iva_coef)
          precio+= iva
        }

        if (plan.validez.toLowerCase() === 'trimestral') {
          vence = moment().add(3, 'months').format()
        }

        let pago = {
          concepto: 'Festive Plan Premium Trimestral',
          metodo: 'Mercadopago',
          moneda: 'ARS',
          cantidad: 1,
          proveedor_id: req.decoded.id,
          proveedor: proveedor.nombre,
          empresa: proveedor.empresa,
          plan: plan.slug,
          validez: plan.validez,
          total: Math.round(precio),
          iva_precio: iva,
          vence: vence,
          creado: new Date()
        }
        
        req.app.db.collection('pagos').insertOne(pago, function (err, response) {
          if(err) {
            res.status(200).send({ status: 'error: ' + err })
          } else {
            let result = response.ops[0]
            let preference = {
              items: [
                {
                  id: result._id.toString(),
                  title: result.concepto,
                  description: result.concepto,
                  unit_price: result.total,
                  currency_id: result.moneda,
                  quantity: result.cantidad
                }
              ],
              notification_url: 'https://' + req.get('host') + "/mercadopago/notificacion",
              external_reference: result._id.toString()
            };

            mercadopago.preferences.create(preference).then(function(response){
              return res.json(response.body)
            }).catch(function(error){
              console.log("mercadopago error: ");
              console.log(error);
            })
          }
        })
      })
    })
  },
  notification: (req, res) => {
    if(req.body.data){
      axios.get('https://api.mercadopago.com/v1/payments/' + req.body.data.id + '?access_token=' + process.env.MP_TOKEN, {} ).then((response) => {
        // check if notification exists
        req.app.db.collection('pagos').findOneAndUpdate(
        {
          '_id': new ObjectId(response.data.external_reference)
        },
        {
          "$set": {
            mercadopago : response.data
          }
        },{ 
          upsert: true, 
          'new': true, 
          returnOriginal:false 
        }).then(function(pago) {
          if (pago.value.mercadopago.status === 'approved') {
            req.app.db.collection('proveedores').findOneAndUpdate(
            {
              '_id': new ObjectId(pago.value.proveedor_id)
            },{
              "$set" : {
                plan: pago.value.plan,
                plan_updated: new Date()
              }
            },{ 
              upsert: true, 
              'new': true, 
              returnOriginal:false 
            }).then(function(proveedor){
              if (!proveedor) return res.status(404).send('No account found.')
              return emailClient.send({
                to: proveedor.value.email,
                subject:'Plan upgrade',
                data:{
                  title:'Bienvenido a Festive Premium',
                  message: `Hola ${proveedor.value.nombre}, bienvenido a Festive Premium. Recuerda que el periodo de validez de la suscripción es trimestral. Te enviaremos un recordatorio para renovarlo si así lo deseas.`,
                  link: process.env.APP_URL + '/plan-premium',
                  linkText:'Ver beneficios de plan Premium',
                  tag: 'proveedor'
                },
                templatePath:path.join(__dirname,'/../email/template.html')
              }).then(function(){
                res.sendStatus(200)
              }).catch(function(err){
                if(err) console.log(err)
                res.sendStatus(200)
              })
            }).catch((err) => {
              return res.json(err)
            })
          }
        }).catch((err) => {
          return res.json(err)
        })
      })
    } else {
     res.sendStatus(200)
    }
  },
  procesar_pago: (req, res) => { 
    res.redirect(process.env.PANEL_URL + '/planes/pago-procesado/' + req.body.payment_status)
  }
}