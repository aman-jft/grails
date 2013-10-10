modules = {
    application {
        resource url:'js/application.js'
    }

    jquery{

        resource url: 'js/jquery-1.10.2.min.js'
    }

    bootstrap{
        dependsOn('jquery')
        resource url: 'css/bootstrap.css'
        resource url: 'css/bootstrap-responsive.min.css'
        resource url: 'js/bootstrap.js'
    }

    angular{
        dependsOn('bootstrap')
        resource url: 'js/angular.js'
    }

    routes{
        dependsOn('angular')
        resource 'js/contacts.js'
    }
}
