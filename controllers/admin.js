const path = require("path")
const bson = require('bson')
const bcrypt = require('bcrypt')
const tokenExpires = 86400 * 30 * 12 // 1 year
const saltRounds = 10
const emailHelper = require('../email/helper')
const emailClient = emailHelper()
const ObjectId = require('mongodb').ObjectId

module.exports = {
  disapprove: (req, res) => {
    req.app.db.collection('proveedores').findOneAndUpdate(
    {
      '_id': new ObjectId(req.body._id)
    },{
      "$set" : {
        rol: 'deshabilitado',
        plan: ''
      }
    },{ 
      upsert: true, 
      'new': true, 
      returnOriginal:false 
    }).then(function(doc){
      return emailClient.send({
        to: doc.value.email, 
        subject: `Cuenta deshabilitada`,
        data: {
          title: `¡Lo sentimos ${doc.value.nombre}!`,
          message: '<p>Tu cuenta de proveedor fue deshabilitada temporalmente por incumplimiento de algunas de nuestras políticas de privacidad y/o términos y condiciones de uso.</p><p>En caso de considerarlo necesario, nuestro equipo de soporte se comunicará con usted para solucionarlo.</p>',
          link: process.env.APP_URL + '/como-funciona',
          linkText: 'Conocer más acerca de Festive',
          tag: 'cliente'
        },
        templatePath:path.join(__dirname,'/../email/template.html')
      }).then(function(){
        res.json({
          status: 'success'
        })
      }).catch(function(err){
        if(err) console.log(err)
        res.json({
          status: 'error: ' + err
        })
      })
    })
  },
  approve: (req, res) => {
    let codigo_invitacion = new bson.ObjectID().toString()
    var data = {}

    if (req.body.plan === 'free') {
      data.subject = 'Aprobación de cuenta'
      data.title = '¡Felicitaciones!'
      data.message = '¡Fuiste aprobado para formar parte de Festive! Seguí el enlace para obtener acceso a tu panel de proveedor.',
      data.link = process.env.PANEL_URL + '/registrarme/' + codigo_invitacion,
      data.linkText = 'Comenzar'
    }

    if (req.body.plan === 'premium') {
      data.subject = 'Activación de plan'
      data.title = '¡Excelentes noticias!'
      data.message = 'Ahora sos parte de nuestros clientes exclusivos. Trabajamos todos los días para llevar tu negocio a un próximo nivel y estamos orgullosos de contarte como cliente premium.',
      data.link = process.env.PANEL_URL + '/premium',
      data.linkText = 'Conocé los beneficios de plan Premium'
    }
    req.app.db.collection('proveedores').findOneAndUpdate(
    {
      '_id': new ObjectId(req.body._id)
    },{
      "$set" : {
        rol: 'proveedor',
        plan: req.body.plan || 'free',
        maileado: true,
        codigo_invitacion: codigo_invitacion
      }
    },{ 
      upsert: true, 
      'new': true, 
      returnOriginal:false 
    }).then(function(doc){
      return emailClient.send({
        to: doc.value.email, 
        subject: 'Festive: Fuiste aprobado',
        data: {
          title: '¡Buenas noticias!',
          message: 'Fuiste aprobado para formar parte de Festive. Ahora podés ser parte de nuestra plataforma. Seguí este enlace para empezar.',
          link: process.env.PANEL_URL + '/registrarme/' + codigo_invitacion,
          linkText: 'Registrarme ahora',
          tag: 'proveedor'
        },
        templatePath:path.join(__dirname,'/../email/template.html')
      }).then(function(){
        res.json({
          status: 'success'
        })
      }).catch(function(err){
        if(err) console.log(err)
        res.json({
          status: 'error: ' + err
        })
      })
    })
  },
  restore_password: (req, res) => {
    var code = new bson.ObjectID().toString()
    req.app.db.collection('cuentas').findOneAndUpdate(
    {
      email: req.body.email
    },
    {
      "$set": { codigo_recuperacion: code }
    },
    { 
      upsert: true, 
      'new': false,
      returnOriginal: true
    }).then(function(doc){
      return emailClient.send({
        to: req.body.email,
        subject: 'Restaurar contraseña',
        data: {
          title:`Hola, ${doc.nombre}. Solicitaste ayuda con tu contraseña.`,
          message:`Alguien solicitó una restauración de constraseña. Si no fuiste vos quien la solicitó podés ignorar este mensaje. `,
          link: process.env.PANEL_URL + '/actualizar-contrasena/' + code,
          linkText:'Actualizar mi contraseña ahora',
          tag: 'proveedor'
        },
        templatePath:path.join(__dirname,'/../email/template.html')
      })
    })
  },
  update_password: (req, res) => {
    let password = req.body.password
    bcrypt.hash(password, saltRounds, function (err, hash) {
      req.app.db.collection('cuentas').findOneAndUpdate(
      {
        codigo_recuperacion: req.body.codigo_recuperacion
      },
      {
        "$set": { 
          password: hash,
          codigo_recuperacion: null 
        }
      },
      { 
        upsert: true, 
        'new': false,
        returnOriginal: true
      }).then(function(doc){
        return emailClient.send({
          to: req.body.email,
          subject: 'Contraseña actualizada',
          data: {
            title:`Hola, ${doc.nombre}. Actualizaste tu contraseña.`,
            message:`El proceso de recuperación de cuenta se completó con éxito. Ya podés iniciar sesión con tu nueva contraseña.`,
            link: process.env.PANEL_URL + '/iniciar-sesion',
            linkText:'Iniciar sesión ahora',
            tag: 'proveedor'
          },
          templatePath:path.join(__dirname,'/../email/template.html')
        })
      })
    })
  },
  restore_password: (req, res) => {
    req.app.db.collection('cuentas').findOne({
      email: req.body.email,
      rol: 'proveedor'
    },function(err, account) {
      if (!account) return res.status(404).send('No account found.')
      var code = new bson.ObjectID().toString()
      req.app.db.collection('cuentas').findOneAndUpdate(
      {
        email: req.body.email,
        rol: 'proveedor'
      },
      {
        "$set": { codigo_recuperacion: code }
      },
      { 
        upsert: true, 
        'new': false,
        returnOriginal: true
      }).then(function(doc){
        return emailClient.send({
          to: req.body.email,
          subject: 'Restaurar contraseña',
          data: {
            title:`Hola, ${doc.value.nombre}. Solicitaste ayuda con tu contraseña.`,
            message:`Alguien solicitó una restauración de constraseña. Si no fuiste vos quien la solicitó podés ignorar este mensaje. `,
            link: process.env.ADMIN_URL + '/actualizar-contrasena/' + code,
            linkText:'Actualizar mi contraseña ahora',
            tag: 'proveedor'
          },
          templatePath:path.join(__dirname,'/../email/template.html')
        }).then(function(){
          res.json({
            status: 'success'
          })
        }).catch(function(err){
          if(err) console.log(err)
          res.json({
            status: 'error: ' + err
          })
        })
      })
    })
  },
  change_password: (req, res) => {
    var password = req.body.password
    req.app.db.collection('cuentas').findOne({
      _id: new ObjectId(req.decoded.id)
    },function(err, doc) {
      if (err) return res.status(500).send('Error on the server:' + err)
      if (!doc) return res.status(404).send({ auth: false, token: null })

      let passwordIsValid = bcrypt.compareSync(req.body.password_current, doc.password)
      if (!passwordIsValid) return res.status(401).send({ auth: false, token: null })

      bcrypt.hash(req.body.new_password, saltRounds, function (err, hash) {
        req.app.db.collection('cuentas').findOneAndUpdate({
          _id: new ObjectId(req.decoded.id)
        },
        {
          "$set": {
            password: hash
          }
        },{ 
          upsert: true, 
          'new': true, 
          returnOriginal:false 
        }).then(function(user) {  
          let token = jwt.sign({ id: user.value._id }, process.env.APP_SECRET, {
            expiresIn: tokenExpires
          })
          res.status(200).send({ auth: true, token: token, user: user.value });
        }).catch(function(err){
          if(err) return res.status(500).send("There was a problem getting user " + err)
        })
      })
    })
  },
  update_password: (req, res) => {
    req.app.db.collection('cuentas').findOne({
      codigo_recuperacion: req.body.code
    },function(err, account) {
      if (!account) return res.status(404).send('No account found.')
      let password = req.body.password
      bcrypt.hash(password, saltRounds, function (err, hash) {
        req.app.db.collection('cuentas').findOneAndUpdate(
        {
          codigo_recuperacion: req.body.code
        },
        {
          "$set": { 
            password: hash,
            codigo_recuperacion: null 
          }
        },
        { 
          upsert: true, 
          'new': false,
          returnOriginal: true
        }).then(function(doc){
          return emailClient.send({
            to: req.body.email,
            subject: 'Contraseña actualizada',
            data: {
              title:`Hola, ${doc.nombre}. Actualizaste tu contraseña.`,
              message:`El proceso de recuperación de cuenta se completó con éxito. Ya podés iniciar sesión con tu nueva contraseña.`,
              link: process.env.ADMIN_URL + '/iniciar-sesion',
              linkText:'Iniciar sesión ahora',
              tag: 'proveedor'
            },
            templatePath:path.join(__dirname,'/../email/template.html')
          }).then(function(){
            res.json({
              status: 'success'
            })
          }).catch(function(err){
            if(err) console.log(err)
            res.json({
              status: 'error: ' + err
            })
          })
        })
      })
    })
  },
  create_account: (req, res) => {
    let password = new bson.ObjectID().toString()
    bcrypt.hash(password, saltRounds, function (err, hash) {
      req.body.password = hash
      req.body.rol = 'admin'
      req.body.creado = new Date()
      req.app.db.collection('cuentas').insertOne(req.body, function (err, results) {
        if(err) {
          res.status(200).send({ status: 'error: ' + err })
        } else {
          return emailClient.send({
            to: req.body.email,
            subject: 'Nueva cuenta administración',
            data: {
              title:`Hola, ${req.body.nombre}. Una cuenta fue creada para vos.`,
              message:`
                <p>A continuación los datos de acceso<p>
                <p>
                  <span>Usuario: ${req.body.email}</span><br>
                  <span>Contraseña: ${password}</span>
                </p>`,
              link: process.env.ADMIN_URL + '/iniciar-sesion',
              linkText:'Iniciar sesión ahora',
              tag: 'proveedor'
            },
            templatePath:path.join(__dirname,'/../email/template.html')
          }).then(function(){
            res.json({
              status: 'success'
            })
          }).catch(function(err){
            if(err) console.log(err)
            res.json({
              status: 'error: ' + err
            })
          })
        }
      })
    })
  },
  searchall: (req, res) => {
    var results = []
    var all = req.app.db.listCollections().toArray((err, cols) => {
      cols.map((e, i) => {
        req.app.db.collection(e.name).find({ 
          $or: [
            { nombre: { "$regex": req.body.query, '$options' : 'i' }},
            { contenido: { "$regex": req.body.query, '$options' : 'i' }}
          ]
        }).toArray((err,docs) => {
          if (docs.length) {
            results.push({ 
              name: e.name,
              data: docs
            })
          }
          if (i === cols.length - 1) {
            return res.json(results)    
          }
        })
      })
    })    
  }
}