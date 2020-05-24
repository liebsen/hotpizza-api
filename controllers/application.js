const path = require("path")
const bcrypt = require('bcrypt')
const moment = require('moment')
const tokenExpires = 86400 * 30 * 12 // 1 year
const saltRounds = 10
const emailHelper = require('../email/helper')
const emailClient = emailHelper()
const ObjectId = require('mongodb').ObjectId

module.exports = {
  section: (req, res) => {
    req.app.db.collection('sitio').findOne({},function(err, site) {
      req.app.db.collection('secciones').find({
        slug: req.params.slug
      }).toArray((err,docs) => {
        let section = docs[0] || {}
        return res.json({
          site: site,
          section: section
        })
      })
    })
  },
  provider: (req, res) => {
    req.app.db.collection('proveedores').find({
      _id: new ObjectId(req.params.id)
    }).project({
        email: 1,
        nombre: 1,
        avatar: 1,
        empresa: 1,
        rubro: 1,
        zona: 1,
        localidad: 1,
        tagline: 1,
        telefono: 1,
        redsocial: 1,
        plan: 1,
        fanpage: 1,
        website: 1,
        base: 1,
        galeria: 1,
        videos: 1,
        anticipo: 1,
        horas: 1,
        evento: 1,
        horas_evento: 1,
        metodo_pago: 1,
        movilidad: 1,
        aire_libre: 1,
        horas_extra: 1,
        servicio_dura: 1,
        servicio_incluye: 1,
        servicio_describe: 1,
        servicio_cuenta: 1,
        horas: 1,
        evento: 1,
        horas_evento: 1,
        metodo_pago: 1,
        anticipo: 1 
      }).toArray((err,docs) => {
      return res.json(docs[0])
    })
  },
  contact: (req, res) => {
    req.body.creado = new Date()
    req.app.db.collection('consultas').insertOne(req.body, function (err, results) {
      if(err) {
        res.status(200).send({ status: 'error: ' + err })
      } else {
        return emailClient.send({
          to: process.env.EMAIL_SMTP_USER,
          subject: `Nuevo contacto desde ${req.body.origen}`,
          data: {
            title:`Hola, ${req.body.nombre} tiene una consulta desde <strong>${req.body.origen}</strong>.`,
            message:`
              <p>
                <span>Nombre: ${req.body.nombre}</span><br>
                <span>Teléfono: ${req.body.telefono}</span><br>
                <span>Email: ${req.body.email}</span><br>
                <span>Empresa: ${req.body.empresa}</span><br>
                <span>Website: ${req.body.website}</span><br>
                <span>Consulta: ${req.body.consulta}</span>
              </p>`,
            link: `mailto:${req.body.email}`,
            linkText: `Responder a ${req.body.nombre}`,
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
  },
  search: (req, res) => {
    let que = req.params.que.toString()
    let donde = req.params.donde.toString()
    let find = {}

    find['rol'] = 'proveedor'

    if (que !== '*') {
      find['rubros.servicios._id'] = que
    }

    if (donde !== '*') {
      find['zonas.localidades._id'] = donde
    }

    req.app.db.collection('proveedores')
      .find(find)
      .project({
        email: 1,
        nombre: 1,
        avatar: 1,
        empresa: 1,
        rubro: 1,
        zona: 1,
        localidad: 1,
        tagline: 1,
        telefono: 1,
        redsocial: 1,
        plan: 1,
        fanpage: 1,
        website: 1,
        base: 1,
        galeria: 1,
        videos: 1,
        horas: 1,
        evento: 1,
        horas_evento: 1,
        metodo_pago: 1,
        anticipo: 1,
        movilidad: 1,
        aire_libre: 1,
        horas_extra: 1,
        servicio_incluye: 1,
        servicio_dura: 1,
        servicio_describe: 1,
        servicio_cuenta: 1,
        horas: 1,
        evento: 1,
        horas_evento: 1,
        metodo_pago: 1,
        anticipo: 1 
      }).toArray((err,docs) => {
        return res.json(docs)
      })
  },
  data: (req, res) => {
    req.app.db.collection('proveedores').distinct('rubros.servicios._id',{
      rol: 'proveedor'
    }).then(serviciosIds => {
      req.app.db.collection('proveedores').distinct('zonas.localidades._id',{
        rol: 'proveedor'
      }).then(localidadesIds => {
        req.app.db.collection('rubros').find({
          activo: true
        }).project({ servicios: true }).toArray((err,rubros) => {
          req.app.db.collection('zonas').find({
            activo: true
          }).project({ localidades: true }).toArray((err,zonas) => {
            req.app.db.collection('proveedores').find({
              rol: 'proveedor',
              destacado: true
            }).project({
              nombre: true, 
              tagline: true,
              rubro: true,
              localidad: true,
              base: true,
              empresa: true, 
              avatar: true
            }).toArray((err,destacados) => {
              
              let serviciosMap = {}
              rubros.map(i => {
                i.servicios.map(o => {
                  serviciosMap[o._id] = o      
                })
              })                

              let localidadesMap = {}
              zonas.map(i => {
                i.localidades.map(o => {
                  localidadesMap[o._id] = o      
                })
              })

              serviciosIds = serviciosIds.filter(e => {
                return serviciosMap[e]
              })

              localidadesIds = localidadesIds.filter(e => {
                return localidadesMap[e]
              })

              return res.json({
                servicios: serviciosMap,
                localidades: localidadesMap,
                destacados: destacados,
                filtros: {
                  servicios: serviciosIds,
                  localidades: localidadesIds
                }
              })
            })
          })
        })
      })
    })
  },
  request: (req, res) => {
    req.body.creado = new Date
    req.body._id = new ObjectId().toString()
    if (req.params.id) {
      req.app.db.collection('proveedores').findOneAndUpdate(
      {
        _id : new ObjectId(req.params.id)
      },
      {
        "$push" : { 'consultas' : req.body }
      },
      { 
        upsert: true, 
        'new': true, 
        returnOriginal:false 
      }).then(function(doc){
        return emailClient.send({
          to:doc.value.email,
          subject: doc.value.nombre + ', tenés una nueva solicitud de presupuesto',
          data:{
            title:`Hola ${doc.value.nombre}. Solicitaron presupuesto de forma directa`,
            message:`
              <figure>
                <blockquote>${req.body.mensaje}</blockquote>
                <figcaption><strong>${req.body.nombre}</strong></figcaption>
              </figure>
              <p>
                <span><a style="color:#CBAAC7" href="tel:${req.body.telefono}">${req.body.telefono}</a></span><br>
                <span><a style="color:#CBAAC7" href="mailto:${req.body.email}">${req.body.email}</a></span>
              </p>`,
            link: process.env.PANEL_URL + '/solicitudes',
            linkText:'Ver mis solicitudes',
            tag: 'proveedor'
          },
          templatePath:path.join(__dirname,'/../email/template.html')
        }).catch(function(err){
          if(err) console.log(err)
        }).then(function(){
          res.status(200).send({ status: 'success' });
        })
      }).catch(function(err){
        if(err){
          return res.json({
            status: 'error: ' + err
          })
        }
      })
    } else {
      req.body._id = new ObjectId()
      req.app.db.collection('presupuestos').insertOne(req.body, function (error, response) {
        if(error) {
          console.log('Error occurred while inserting');
        } else {
          res.status(200).send({ status: 'success' });
        }
      })
    }
  },
  iconclick: (req, res) => {

    let clickObject = {
      ip: req.connection.remoteAddress,
      fecha: new Date()
    }
    
    req.app.db.collection('proveedores').findOneAndUpdate({
      _id: new ObjectId(req.body._id)
    },
    {
      "$push" : { ['clicks.' + req.body.tag] : clickObject }
    },
    { 
      upsert: true, 
      'new': true, 
      returnOriginal:false 
    }).then(function(doc){
      return res.json({ status: 'success' })
    }).catch(function(err){
      if(err){
        return res.json({
          status: 'error: ' + err
        })
      }
    })
  },
  blog: {
    listing: (req, res) => {
      req.app.db.collection('blog').find().toArray((err,docs) => {
        return res.json(docs)
      })
    },
    category: (req, res) => {
      req.app.db.collection('blog').find({
        slug: req.params.slug.toString()
      }).toArray((err,docs) => {
        return res.json(docs[0])
      })
    },
    entry: (req, res) => {
      req.app.db.collection('blog').aggregate(
      { $match : {
        slug: req.params.slug.toString(),
        'entradas.slug': req.params.sslug
      }},
      { $unwind : "$entradas"},
      { $match : {
        slug: req.params.slug.toString(),
        'entradas.slug': req.params.sslug
      }},{ $group: { "entradas.slug": req.params.sslug, count: { $sum: 1 } } })
      .toArray(function(err,results){
        return res.json(results[0])
      })  
    },
    search: (req, res) => {
      req.app.db.collection('blog').find({
        $or: [
          {'entradas.nombre': { "$regex": req.body.query, '$options' : 'i' }},
          {'entradas.contenido': { "$regex": req.body.query, '$options' : 'i' }}
        ]
      }).toArray((err,docs) => {
        return res.json(docs || [])
      })
    }
  }
}