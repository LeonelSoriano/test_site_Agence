'use strict';

var express = require('express');
var controller = require('./thing.controller');

var router = express.Router();

router.get('/user/', controller.findAllUser);
router.post('/relatorio/', controller.getRelatorioData);
router.post('/pie/', controller.getDataPie);
router.post('/bar/', controller.getDataBar);


module.exports = router;
