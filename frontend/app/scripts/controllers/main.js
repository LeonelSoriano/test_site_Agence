'use strict';

/**
 * @ngdoc function
 * @name siteAgenceApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the siteAgenceApp
 */
angular.module('siteAgenceApp')
.config(['cfpLoadingBarProvider','ChartJsProvider', function(cfpLoadingBarProvider,
ChartJsProvider) {
    cfpLoadingBarProvider.includeSpinner = false;

ChartJsProvider.setOptions({
    
 tooltipFontColor: "#ff0",
    
});

  }])
  .controller('MainCtrl', function ($scope, $http,growl) {
 
    
    //config
    $scope.configurationDatePicker = {
      minMode: 'month',
      maxDate: new Date(2007, 12, 1),
      minDate: new Date(2002, 12, 31)
    }

    //var
    $scope.popupBefore = {
      opened: false,
      dt : new Date(2002, 12, 1)
    };

    $scope.popupAfter = {
      opened: false,
      dt : new Date(2003, 1, 1)
    };

    $scope.labels = [];
    $scope.data = [];
    $scope.series = [];
    $scope.datasetOverride = [];
    
    $scope.optionPie =  {
      tooltips: {
        enabled: true,
         callbacks: {
                  label: function(tooltipItem, data) {

                    var totalValue = data.datasets[0].data.reduce(
                      (accumulator, currentValue) => accumulator + currentValue);
                    
                    var porcent = data.datasets[0].data[tooltipItem.index] 
                      * 100 / totalValue;

                    return data.labels[tooltipItem.index] + " " 
                      + porcent.toLocaleString(undefined, 
                        { maximumFractionDigits: 2 }) + "%";
                  }
                }
      }
    };//end optionPie
    
    $scope.consultoresOption = {
	  title: 'Consultores',
	  filterPlaceHolder: 'Filtre consultores',
	  labelAll: 'Todos los itenes',
	  labelSelected: 'Itenes seleccionados',
	  helpMessage: ' ',
	  orderProperty: 'no_usuario',
	  items: [],
	  selectedItems: []
    };

    //vista actual para las acciones de botones de consultores
    $scope.activeViewData = 0;

    //informacion para llenar las tablas de relatorio
    $scope.dataRelatorio = [];

    //init funtion

    $http.get(endPoint.baseUrl + endPoint.consultores)
    .then(function successCallback(response) {
        for (var i = 0, len = response.data.length; i < len; i++) {
            response.data[i].name = response.data[i].no_usuario;
        }
        $scope.consultoresOption.items = response.data;
    }, function errorCallback(response) {
        console.error(response);
        $scope.consultoresOption.items = [];
    });

      



    //funtion
    $scope.popupBeforeOpen = () => 
    {
      $scope.popupBefore.opened = true;
    };

    $scope.popupAfterOpen = () => 
    {
      $scope.popupAfter.opened = true;
    };


    //actions
    $scope.selectRelatorio = function()
    {
        var consultoresIds = [];
        for (var i = 0, len = 
            $scope.consultoresOption.selectedItems.length; i < len; i++) {
            consultoresIds.push($scope.consultoresOption
                .selectedItems[i].co_usuario);
        }

        if(consultoresIds.length === 0){
            growl.error("Debe seleccionar por lo menos un usuario", {ttl: 8000});
            return;
        }else if($scope.popupBefore.dt.getTime() > 
          $scope.popupAfter.dt.getTime()){
          growl.error("Fecha anterior debe ser menor", {ttl: 8000});
          return;
        }
        $scope.activeViewData = 1;

        var parameter = JSON.stringify({
          consultores: consultoresIds,
          beforeDate: $scope.popupBefore.dt,
          afterDate: $scope.popupAfter.dt
        });

        $scope.labels = [];
        $scope.data = [];
        $scope.series = [];
        $scope.datasetOverride = [];

        $http.post(endPoint.baseUrl + endPoint.relatorioView, parameter ).
            then(function successCallback(response) {
                $scope.dataRelatorio = response.data.data;
            }, function errorCallback(response) {
                console.error(response);
          });
            
    }//end selectRelatorio



    $scope.selectPizza = function(){
        
      var consultoresIds = [];
      for (var i = 0, len = 
        $scope.consultoresOption.selectedItems.length; i < len; i++) {
        consultoresIds.push($scope.consultoresOption
          .selectedItems[i].co_usuario);
      }

      if(consultoresIds.length === 0){
        growl.error("Debe seleccionar por lo menos un usuario",{ttl: 8000});
        return;
      }else if($scope.popupBefore.dt.getTime() > 
          $scope.popupAfter.dt.getTime()){
          growl.error("Fecha anterior debe ser menor", {ttl: 8000});
          return;
      }

      $scope.activeViewData = 3;


      var parameter = JSON.stringify({
        consultores: consultoresIds,
        beforeDate: $scope.popupBefore.dt,
        afterDate: $scope.popupAfter.dt
      });

      $scope.labels = [];
      $scope.data = [];
      $scope.series = [];
      $scope.datasetOverride = [];

      $http.post(endPoint.baseUrl + endPoint.pie, parameter).
        then(function successCallback(response) {
          $scope.labels = response.data.data.users;
          $scope.data = response.data.data.values;

        }, function errorCallback(response) {
          console.error(response);
      });

    }//end select pizza




    $scope.selectBar = function(){
          
      var consultoresIds = [];
      for (var i = 0, len = 
        $scope.consultoresOption.selectedItems.length; i < len; i++) {
        consultoresIds.push($scope.consultoresOption
          .selectedItems[i].co_usuario);
      }

      if(consultoresIds.length === 0){
        growl.error("Debe seleccionar por lo menos un usuario",{ttl: 8000});
        return;
      }else if($scope.popupBefore.dt.getTime() > 
          $scope.popupAfter.dt.getTime()){
          growl.error("Fecha anterior debe ser menor", {ttl: 8000});
          return;
      }


      $scope.activeViewData = 2;


      var parameter = JSON.stringify({
        consultores: consultoresIds,
        beforeDate: $scope.popupBefore.dt,
        afterDate: $scope.popupAfter.dt
      });

      $scope.labels = [];
      $scope.data = [];
      $scope.series = [];
      $scope.datasetOverride = [];

      $http.post(endPoint.baseUrl + endPoint.bar, parameter).
        then(function successCallback(response) {
          //console.log(response);
          $scope.labels = response.data.data.labels;
          $scope.series = response.data.data.series;
          $scope.data = response.data.data.data;

          $scope.datasetOverride = [
          
{
            label: "Line chart",
          borderWidth: 3,
          hoverBackgroundColor: "rgba(255,99,132,0.4)",
          hoverBorderColor: "rgba(255,99,132,1)",
          type: 'line'
        },

          {
            label: "Bar chart",
            borderWidth: 1,
            type: 'bar'
          }
          
        ];


        }, function errorCallback(response) {
          console.error(response);
      });


    }//end select bar



});//end of module



