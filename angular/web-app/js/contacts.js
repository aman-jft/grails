/**
 * Created with IntelliJ IDEA.
 * User: prashant
 * Date: 10/10/13
 * Time: 1:46 PM
 * To change this template use File | Settings | File Templates.
 */
angular
    .module('myApp',[])
    .config(function($routeProvider){
        var dataObject = $('#defaultDiv');
        var baseUrl = dataObject.data('templateBaseUrl');
        $routeProvider
            .when('/contact/:index',{
                templateUrl:baseUrl+'/edit.html',
                controller:'Edit'
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
    });