/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/things              ->  index
 * POST    /api/things              ->  create
 * GET     /api/things/:id          ->  show
 * PUT     /api/things/:id          ->  update
 * DELETE  /api/things/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var moment = require('moment');
var sqldb = require('../../sqldb');
var Thing = sqldb.Thing;



function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function(err) {
    res.status(statusCode).send(err);
  };
}

function responseWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function(entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function handleEntityNotFound(res) {
  return function(entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function saveUpdates(updates) {
  return function(entity) {
    return entity.updateAttributes(updates)
      .then(function(updated) {
        return updated;
      });
  };
}

function removeEntity(res) {
  return function(entity) {
    if (entity) {
      return entity.destroy()
        .then(function() {
          res.status(204).end();
        });
    }
  };
}


exports.findAllUser = function(req, res) {

    sqldb.sequelize.query("select * from cao_usuario inner join permissao_sistema on permissao_sistema.co_usuario = cao_usuario.co_usuario where permissao_sistema.co_sistema = 1 and  permissao_sistema.in_ativo = 'S' and permissao_sistema.co_tipo_usuario in (0, 1,2);",
    {  type: sqldb.sequelize.QueryTypes.SELECT 
  }).then(function(projects) {
    res.status(200).json(projects);
  }).catch( function(e){   res.status(200).json(e);  });
};



exports.getRelatorioData = async function(req, res) {

    let consultores = req.body.consultores;

    let afterDate = req.body.afterDate;

    let beforeDate = req.body.beforeDate;

    let momentAfter = moment(afterDate);

    let momentBefore = moment(beforeDate);


    let jsonResponse = [];

    for (var i = 0; i < consultores.length; i++) {

      let jsonActualItem = {};

      jsonActualItem.total = {
        liquida: 0,
        custo: 0,
        comision: 0,
        lucro: 0
      };
            
      await sqldb.sequelize.query("SELECT * FROM cao_usuario WHERE co_usuario = :co_usuario",
        {
          replacements: { co_usuario: consultores[i]},
          type: sqldb.sequelize.QueryTypes.SELECT
        })
        .then(function(responseConsultores) {
        //response consultores
        if(responseConsultores.length === 1){
          jsonActualItem.user = responseConsultores[0].no_usuario;
        }
        
      }).catch( function(e){ console.log(e);  /*res.status(200).json(e);*/  });

      
      jsonActualItem.values = [];


      for (var m = moment(momentBefore); m.diff(momentAfter, 'months') <= 0;
            m.add(1, 'months')) {

        let actualDateCompare =  m.format('YYYY-MM-DD');

        let actualValuesData = {};

        actualValuesData.periodo = actualDateCompare;

        await sqldb.sequelize.query(`
              select sum(( cao_fatura.valor) - (cao_fatura.valor * cao_fatura.total_imp_inc/100))
              as receita_liquida  from cao_fatura inner join cao_os
              on cao_fatura.co_os = cao_os.co_os where cao_os.co_usuario  = :co_usuario 
              and year(cao_fatura.data_emissao) = year('${actualDateCompare}')
              and month(cao_fatura.data_emissao) = month('${actualDateCompare}');
              `,
            {  
              type: sqldb.sequelize.QueryTypes.SELECT,
              replacements: { co_usuario: consultores[i]},
            }
        ).then(function(responseFatura) {
            
          if(responseFatura.length === 1){
            
            actualValuesData.liquida = (responseFatura[0].receita_liquida === null)? 0 :
              responseFatura[0].receita_liquida; 
          }

        }).catch( function(e){   console.log(e);  });



          //salario bruto
        await sqldb.sequelize.query(`select brut_salario from 
          cao_salario where co_usuario= :co_usuario;`,
          {  
            type: sqldb.sequelize.QueryTypes.SELECT,
            replacements: { co_usuario: consultores[i]},
          }
          ).then(function(responseData) {
            
            if(responseData.length === 1){
              actualValuesData.custo = (responseData[0].brut_salario === null)?
               0 : responseData[0].brut_salario; 
            }else{
              actualValuesData.custo = 0;
            }
              
          }).catch( function(e){   console.log(e);  });

      

        //comision
        await sqldb.sequelize.query(`select sum((cao_fatura.valor - 
          (cao_fatura.valor * cao_fatura.total_imp_inc/100)) * 
          (cao_fatura.comissao_cn/100)) as total
          from cao_fatura inner join cao_os on cao_fatura.co_os = cao_os.co_os
          where cao_os.co_usuario  = :co_usuario
          and year(cao_fatura.data_emissao) = year('${actualDateCompare}')
          and month(cao_fatura.data_emissao) = month('${actualDateCompare}');`,
          {
            type: sqldb.sequelize.QueryTypes.SELECT,
            replacements: { co_usuario: consultores[i]},
          }
          ).then(function(responseData) {
            
            if(responseData.length === 1){
              actualValuesData.comision = (responseData[0].total === null)? 0 :
                responseData[0].total; 
            }
              
          }).catch( function(e){   console.log(e);  });
    
          
            actualValuesData.lucro = actualValuesData.liquida - 
              (actualValuesData.custo + actualValuesData.comision);

            jsonActualItem.total.liquida += actualValuesData.liquida;
            jsonActualItem.total.custo += actualValuesData.custo;
            jsonActualItem.total.comision += actualValuesData.comision;
            jsonActualItem.total.lucro += actualValuesData.lucro;

            if(actualValuesData.liquida !== 0 ||
              actualValuesData.custo !== 0 ||
              actualValuesData.comision !== 0 ||
             actualValuesData.lucro !== 0){
              jsonActualItem.values.push(actualValuesData);
            
            }
          


      }//end for dates
          
          jsonResponse.push(jsonActualItem);
     
    }//end for

    res.status(200).json({data: jsonResponse});
};



exports.getDataPie = async function(req, res) {

  let consultores = req.body.consultores;

  let afterDate = req.body.afterDate;

  let beforeDate = req.body.beforeDate;

  let momentAfter = moment(afterDate);

  let momentBefore = moment(beforeDate);

  let jsonResponse = {
    users : [],
    values: []
  };

  for (var i = 0; i < consultores.length; i++){
  
    let actualUser = '';
    let sumValueLiquido = 0;


    await sqldb.sequelize.query("SELECT * FROM cao_usuario WHERE co_usuario = :co_usuario",
      {
        replacements: { co_usuario: consultores[i]},
        type: sqldb.sequelize.QueryTypes.SELECT
      })
      .then(function(responseConsultores) {
        //response consultores
        if(responseConsultores.length === 1){
          actualUser = responseConsultores[0].no_usuario;
          //jsonActualItem.user = responseConsultores[0].no_usuario;
        }
        
      }).catch( function(e){ console.log(e);  /*res.status(200).json(e);*/  });


   
    for (var m = moment(momentBefore); m.diff(momentAfter, 'months') <= 0;
      m.add(1, 'months')) {
      
      let actualDateCompare =  m.format('YYYY-MM-DD');
    
      await sqldb.sequelize.query(`
        select sum(( cao_fatura.valor) - (cao_fatura.valor * cao_fatura.total_imp_inc/100))
        as receita_liquida  from cao_fatura inner join cao_os
        on cao_fatura.co_os = cao_os.co_os where cao_os.co_usuario  = :co_usuario 
        and year(cao_fatura.data_emissao) = year('${actualDateCompare}')
        and month(cao_fatura.data_emissao) = month('${actualDateCompare}');
        `,
        {  
          type: sqldb.sequelize.QueryTypes.SELECT,
          replacements: { co_usuario: consultores[i]},
        }
        ).then(function(responseFatura) {
            
          if(responseFatura.length === 1){
            
            sumValueLiquido += (responseFatura[0].receita_liquida === null)? 0 :
              responseFatura[0].receita_liquida; 
          }

        }).catch( function(e){   console.log(e);  });


    
    }//end for date

    if(sumValueLiquido > 0){
      jsonResponse.users.push(actualUser);
      jsonResponse.values.push(sumValueLiquido);
    }

  }//end for consultores


  res.status(200).json({data: jsonResponse});
}//end getDataPie


exports.getDataBar = async function(req, res) {

  let consultores = req.body.consultores;

  let afterDate = req.body.afterDate;

  let beforeDate = req.body.beforeDate;

  let momentAfter = moment(afterDate);

  let momentBefore = moment(beforeDate);

  let jsonResponse = {
    labels: [],
    series: [],
    data: [],
  
  };


  for (var m = moment(momentBefore); m.diff(momentAfter, 'months') <= 0;
      m.add(1, 'months')) {
    jsonResponse.labels.push(m.format('YYYY-MM'));
  }

  for (var i = 0; i < consultores.length; i++){
  
    let actualUser = '';
    let sumValueLiquido = 0;


    await sqldb.sequelize.query("SELECT * FROM cao_usuario WHERE co_usuario = :co_usuario",
      {
        replacements: { co_usuario: consultores[i]},
        type: sqldb.sequelize.QueryTypes.SELECT
      })
      .then(function(responseConsultores) {
        //response consultores
        if(responseConsultores.length === 1){
          actualUser = responseConsultores[0].no_usuario;

          jsonResponse.series.push(actualUser);
          //jsonActualItem.user = responseConsultores[0].no_usuario;
        }
        
      }).catch( function(e){ console.log(e);  /*res.status(200).json(e);*/  });


    let actualData = [];

    for (var m = moment(momentBefore); m.diff(momentAfter, 'months') <= 0;
      m.add(1, 'months')) {

      let actualDateCompare =  m.format('YYYY-MM-DD');

    
      await sqldb.sequelize.query(`
        select sum(( cao_fatura.valor) - (cao_fatura.valor * cao_fatura.total_imp_inc/100))
        as receita_liquida  from cao_fatura inner join cao_os
        on cao_fatura.co_os = cao_os.co_os where cao_os.co_usuario  = :co_usuario 
        and year(cao_fatura.data_emissao) = year('${actualDateCompare}')
        and month(cao_fatura.data_emissao) = month('${actualDateCompare}');
        `,
        {  
          type: sqldb.sequelize.QueryTypes.SELECT,
          replacements: { co_usuario: consultores[i]},
        }
        ).then(function(responseFatura) {
            
          if(responseFatura.length === 1){
            
            actualData.push( roundTo2Decimals(
              (responseFatura[0].receita_liquida === null)? 0 :
              responseFatura[0].receita_liquida));
          }

        }).catch( function(e){   console.log(e);  });


    
    }//end for date

    jsonResponse.data.push(actualData);

  }


  let sumTotal = 0;
  for (var i = 0; i < jsonResponse.data.length; i++) {
    let actualData = jsonResponse.data[i];
    console.log(actualData);
    for (var j = 0; j < actualData.length ; j++) {
      sumTotal += actualData[j];
    }

  }
    

  let valuesOfAvg =  [];
  for (var i = 0, len = jsonResponse.labels.length; i < len; i++) {
    valuesOfAvg.push(sumTotal/jsonResponse.series.length);
  }

  let tmp = jsonResponse.data[0];

  jsonResponse.data[0] = valuesOfAvg;
  jsonResponse.data.push(tmp);

  res.status(200).json({data: jsonResponse});

}


function roundTo2Decimals(numberToRound) {
  return Math.round(numberToRound * 100) / 100
}




// Creates a new Thing in the DB
exports.create = function(req, res) {
  Thing.create(req.body)
    .then(responseWithResult(res, 201))
    .catch(handleError(res));
};

// Updates an existing Thing in the DB
exports.update = function(req, res) {
  
  if(req.body.id){
    delete req.body.id;
  }
  Thing.find({
    where: {
      id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(saveUpdates(req.body))
    .then(responseWithResult(res))
    .catch(handleError(res));
};

// Deletes a Thing from the DB
exports.destroy = function(req, res) {
  Thing.find({
    where: {
      id: req.params.id
    }
  })
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
};


  //Sequelize: Sequelize,
  //sequelize: new Sequelize(config.sequelize.uri, config.sequelize.options)
