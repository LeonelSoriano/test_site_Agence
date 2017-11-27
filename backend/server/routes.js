/**
 * Main application routes
 */

'use strict';

import errors from './components/errors';
import path from 'path';

module.exports = function(app) {

  // Insert routes below
  
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "POST, GET, OPTIONS, DELETE, PUT");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
  next();
});

  
  app.use('/api', require('./api/thing'));
  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth)/*')
   .get(errors[404]);

};
