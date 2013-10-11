/**
 * Created with IntelliJ IDEA.
 * User: prashant
 * Date: 10/10/13
 * Time: 1:46 PM
 * To change this template use File | Settings | File Templates.
 */
angular
    .module('myApp',['ngResource'])
    .config(function($routeProvider,$locationProvider){
        var dataObject = $('#defaultDiv');
        var baseUrl = dataObject.data('templateBaseUrl');
        $routeProvider
            .when('/contact/:index',{
                templateUrl:baseUrl+'/edit.html',
                controller:'Edit'
            })
            .when('/query',{
               controller:'Query',
               templateUrl:baseUrl+'/query.html'
            })
            .when('/',{
                templateUrl:baseUrl+'/list.html'
            });
    })
    .controller('Contacts',function($scope){
        console.info('--------------------');
        $scope.contacts = [
            {name: 'prashant',age:24},
            {name: 'abcd',age:20}
        ]
    })
    .controller('Edit',function($scope,$routeParams){
        $scope.contact=$scope.contacts[$routeParams.index];
    })
    .controller('Query',function($scope,$routeParams,$resource){
        console.info('===============before============') ;
        var query = $resource('routes/query');
        console.info('===============after============') ;
        console.info(query);
        query.get(function($response){
            console.info('===== data 1==== '+$response.username);
        });

    });