const express = require('express');
const { verificaToken } = require('../middlewares/autenticacion');


let app = express();

let Producto = require('../models/producto');

/** 
 * Obtener productos 
 * trae todos los productos 
 * pupulate: usario categoría
 * paginado
 **/
app.get('/productos', verificaToken, (req, res) => {

    let desde = req.query.desde || 0;
    desde = Number(desde);

    let limite = req.query.limite || 5;
    limite = Number(limite);

    Producto.find({ disponible: true })
        .sort('nombre')
        .populate('usuario categoria', 'nombre email')
        .populate('categoria', 'descripcion')
        .skip(desde)
        .limit(limite)
        .exec((err, productos) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            Producto.countDocuments({ disponible: true }, (err, conteo) => {

                res.json({
                    ok: true,
                    productos,
                    cuantos: conteo
                });

            });

        });

});



/** 
 * Obtener producto por ID
 * pupulate: usario categoría
 **/
app.get('/productos/:id', verificaToken, (req, res) => {

    let id = req.params.id;

    Producto.findById(id)
        .populate('usuario categoria', 'nombre email')
        .populate('categoria', 'descripcion')
        .exec((err, productoDB) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            if (!productoDB) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'No se encontro el producto'
                    }
                });
            }

            if (!productoDB.disponible) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'El producto no esta disponible'
                    }
                });
            }

            res.json({
                ok: true,
                productoDB
            });

        });

});



/** 
 * Buscar productos 
 **/

app.get('/productos/buscar/:termino', verificaToken, (req, res) => {

    let termino = req.params.termino;
    let regex = new RegExp(termino, 'i');

    Producto.find({ nombre: regex })
        .populate('categoria', 'descripcion')
        .exec((err, productos) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            res.json({
                ok: true,
                productos
            })

        });

});



/** 
 * Crear un nuevo producto
 * guardar usuario
 * guardar una categoria del listado
 **/
app.post('/productos', verificaToken, (req, res) => {

    let body = req.body;

    let producto = new Producto({
        nombre: body.nombre,
        precioUni: body.precioUni,
        descripcion: body.descripcion,
        disponible: body.disponible,
        categoria: body.categoria,
        usuario: req.usuario._id
    });

    producto.save((err, productoDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        res.status(201).json({
            ok: true,
            productoDB
        });

    });


});


/** 
 * Actualizar un producto
 **/
app.put('/productos/:id', verificaToken, (req, res) => {

    let id = req.params.id;
    let body = req.body;


    Producto.findById(id, (err, productoDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!productoDB) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        productoDB.nombre = body.nombre;
        productoDB.precioUni = body.precioUni;
        productoDB.categoria = body.categoria;
        productoDB.disponible = body.disponible;
        productoDB.descripcion = body.descripcion;

        productoDB.save((err, productoGuardado) => {

            if (!productoGuardado) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            res.json({
                ok: true,
                productoGuardado
            });

        });

    });

});



/** 
 * Eliminar un producto
 * modificando el estado no eliminado físicamente
 **/
app.delete('/productos/:id', verificaToken, (req, res) => {

    let id = req.params.id;

    Producto.findById(id, (err, productoDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!productoDB) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'Producto no existe'
                }
            });
        }

        productoDB.disponible = false;

        productoDB.save((err, productoBorrado) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            res.json({
                ok: true,
                productoBorrado,
                mensaje: 'Producto borrado'
            });
        });


    });

});



module.exports = app;