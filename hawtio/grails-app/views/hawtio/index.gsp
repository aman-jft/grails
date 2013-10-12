<%--
  Created by IntelliJ IDEA.
  User: prashant
  Date: 12/10/13
  Time: 12:47 AM
  To change this template use File | Settings | File Templates.
--%>

<%@ page contentType="text/html;charset=UTF-8" %>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>hawtio</title>
    <link rel="stylesheet" href="${g.createLink(uri: '/css/bootstrap.css')}" type="text/css"/>
    <link rel="stylesheet" href="${g.createLink(uri: '/css/bootstrap-responsive.css')}" type="text/css"/>
    <link rel="stylesheet" href="${g.createLink(uri: '/css/font-awesome.css')}" type="text/css">
    <link rel='stylesheet' href='${g.createLink(uri: '/css/ui.dynatree.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/dynatree-icons.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/datatable.bootstrap.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/ColReorder.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/codemirror.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/angular-ui.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/ng-grid.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/jquery.gridster.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/themes/ambiance.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/themes/blackboard.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/themes/cobalt.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/themes/eclipse.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/themes/elegant.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/themes/erlang-dark.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/themes/lesser-dark.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/themes/monokai.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/themes/neat.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/themes/night.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/themes/rubyblue.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/themes/solarized.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/themes/twilight.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/themes/vibrant-ink.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/codemirror/themes/xq-dark.css')}' type='text/css'>
    <link rel='stylesheet' href='${g.createLink(uri: '/css/toastr.css')}' type='text/css'>
    <link rel="stylesheet" href="${g.createLink(uri: '/css/dangle.css')}">
    <link rel='stylesheet' href='${g.createLink(uri: '/css/site-base.css')}' type='text/css'>
    <!--
  <link rel='stylesheet' media='screen and (min-width: 980px)' href='css/site-wide.css' type='text/css'>
  <link rel='stylesheet' media='screen and (max-width: 979px)' href='css/site-narrow.css' type='text/css'>
  -->


    %{--<link rel='icon' type='image/ico' href='favicon.ico'>--}%

    <!--[if lt IE 9]>
  <!--<script src="lib/html5shiv.js"></script>-->
  <![endif]-->
</head>
<body ng-controller="Core.AppController">
<style>
.ng-cloak {
    display: none;
}
</style>

<!--  navbar-inverse -->
<div id="main-nav" class="navbar navbar-fixed-top" ng-show="!fullScreen()" ng-controller="Core.NavBarController">

    <div class="navbar-inner main-nav-upper" ng-cloak class="ng-cloak">

        <div class="container">
            <div class="pull-left">
                <a class="brand" href="#">
                    <img ng-show="appLogo" ng-src="{{appLogo}}"/>
                    <strong>{{appName}}</strong>
                </a>
            </div>

            <div class="pull-right">
                <ul class="nav nav-tabs pull-right">
                    <li ng-show="loggedIn() && perspectives.length > 1" class="pull-right dropdown">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown"
                           title="The current perspective">
                            <span ng-bind-html-unsafe=" perspectiveDetails.perspective.label || 'Perspective'"></span> <span class="caret"></span>
                        </a>
                        <ul class="dropdown-menu">
                            <li ng-repeat="perspective in perspectives">
                                <a ng-click="perspectiveDetails.perspective = perspective"
                                   ng-hide="perspectiveDetails.perspective.id === perspective.id"
                                   title="Switch to the {{perspective.label}} perspective"
                                   data-placement="bottom">
                                    {{perspective.label}}</a>
                            </li>
                        </ul>
                    </li>
                    <li ng-show="loggedIn()" ng-class="{active : isActive('#/preferences')}">
                        <a ng-href="{{link('#/preferences')}}" title="Edit your preferences" data-placement="bottom">
                            <i class="icon-cogs"></i>
                        </a>
                    </li>
                    <li ng-show="showLogout()">
                        <a href="" title="Log out" data-placement="bottom" ng-click="logout()">
                            <i class="icon-signout"></i>
                        </a>
                    </li>
                    <li ng-hide="loggedIn()" ng-class="{active : isActive('#/login')}">
                        <a ng-href="{{link('#/login')}}" title="Log in" data-placement="bottom">
                            <i class="icon-user"></i>
                        </a>
                    </li>
                    <li ng-show="loggedIn()" ng-class="{active : isActive('#/help')}">
                        <a ng-href="{{link('#/help')}}" title="Read the help about how to use this console"
                           data-placement="bottom">
                            <i class="icon-question-sign"></i>
                        </a>
                    </li>
                </ul>
            </div>

        </div>

    </div>

    <div class="navbar-inner main-nav-lower" ng-cloak class="ng-cloak" ng-show="!login()">
        <div class="container">
            <!--
      <a class="btn btn-navbar collapsed" data-toggle="collapse" data-target=".nav-collapse">
        <span>{{activeLink()}}</span>
      </a>
      -->

            <!--
      <div class="nav-collapse collapsed">
      -->

            <ul ng-show="loggedIn()" class="nav">
                <li ng-repeat="nav in topLevelTabs" ng-class="{active : isActive(nav)}" ng-show="isValid(nav)">
                    <a ng-href="{{link(nav)}}" title="{{nav.title}}" data-placement="bottom" ng-bind="nav.content">
                    </a>
                </li>
            </ul>

            <!--
      </div>
      -->
        </div>
    </div>
</div>

<div id="main" class="container-fluid ng-cloak" ng-controller="Core.ViewController">
    <div ng-include src="viewPartial"></div>
</div>

<div class='instance-name clearfix ng-cloak' ng-show="loggedIn()">
    <i ng-show="collapse === ''" class="clickable icon-caret-right" title="Hide" ng-click="collapse = 'instance-name-collapse'"></i>
    <i ng-show="collapse === 'instance-name-collapse'" class="clickable icon-caret-left" title="Show" ng-click="collapse = ''"></i>
    <div class='collapse-target' ng-class='collapse'>
        <div ng-show="match" class="host-indicator" style="background: {{match.color}}">{{match.name}}</div>
        <ul class='unstyled inline'>
            <li ng-repeat='title in pageTitle'>{{title}}</li>
        </ul>
    </div>
</div>

<div class="ng-cloak">
    <div modal="confirmLogout">

        <form class="form-horizontal no-bottom-margin" ng-submit="doLogout()">
            <div class="modal-header"></div>
            <div class="modal-body">
                <p>Are you sure you want to log out?</p>
            </div>
            <div class="modal-footer">
                <input class="btn btn-success" type="submit" value="Yes">
                <input class="btn btn-primary" ng-click="confirmLogout = false" value="No">
            </div>
        </form>

    </div>
</div>

<div class="ng-cloak">
    <div modal="connectionFailed">
        <form class="form-horizontal no-bottom-margin" ng-submit="confirmConnectionFailed()">
            <div class="modal-header">
                <h2 title="Status Code: {{connectFailure.status}}">Cannot Connect: {{connectFailure.statusText}}</h2>
            </div>

            <div class="modal-body">
                <p>Cannot connect to Jolokia to access this Java process</p>

                <div class="expandable closed">
                    <div title="Headers" class="title">
                        <i class="expandable-indicator"></i> Error Details
                    </div>
                    <div class="expandable-body well">
                        <div class="ajaxError" ng-bind-html-unsafe="connectFailure.summaryMessage"></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <input class="btn btn-success" type="submit" value="Close This Window">
            </div>
        </form>

    </div>
</div>




<!-- charts and jolokia for jmx -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/d3.v3.min.js')}"></script>

<script type="text/javascript" src="${g.createLink(uri: '/lib/jquery-1.8.2.min.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/jolokia-min.js')}"></script>

<script type="text/javascript" src="${g.createLink(uri: '/lib/cubism.v1.min.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/jolokia-cubism-min.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/jolokia-simple-min.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/json2-min.js')}"></script>

<!-- UI framework -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/bootstrap.min.js')}"></script>
<!--
TODO add patch for dashboard until angular supports nested custom injections
<script type="text/javascript" src="lib/angular.min.js"></script>
-->
<script type="text/javascript" src="${g.createLink(uri: '/lib/angular.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/angular-bootstrap.min.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/angular-resource.min.js')}"></script>

<!-- ng-grid -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/ng-grid-2.0.7.min.js')}"></script>

<!-- dyna tree -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/jquery-ui.custom.min.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/jquery.cookie.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/jquery.dynatree.min.js')}"></script>

<!-- dashboard -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/jquery.gridster.min.js')}"></script>

<!-- data tables -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/jquery.dataTables.min.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/jquery.datatable-bootstrap.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/ColReorder.min.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/KeyTable.min.js')}"></script>

<!-- XML 2 json -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/jquery.xml2json.js')}"></script>

<!-- jquery form -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/jquery.form.min.js')}"></script>

<!-- backstretch -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/jquery.backstretch.min.js')}"></script>

<!-- toastr notifications -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/toastr.min.js')}"></script>

<!-- buildGraph layout -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/dagre.min.js')}"></script>

<!-- draggy droppy diagrams -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/jquery.jsPlumb-1.4.1-all-min.js')}"></script>

<!-- ElasticSearch -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/elastic-angular-client.min.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/elastic.min.js')}"></script>

<!-- Dangle -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/d3.min.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/')}lib/dangle.min.js"></script>

<!-- source format -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/codemirror.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/addon/edit/closetag.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/addon/edit/continuecomment.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/addon/edit/continuelist.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/addon/edit/matchbrackets.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/addon/fold/foldcode.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/addon/format/formatting.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/mode/javascript/javascript.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/mode/xml/xml.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/mode/css/css.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/mode/htmlmixed/htmlmixed.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/mode/markdown/markdown.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/mode/diff/diff.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/mode/properties/properties.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/mode/clike/clike.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/codemirror/mode/yaml/yaml.js')}"></script>

<!-- AngularUI -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/angular-ui.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/ui-bootstrap-0.4.0.min.js')}"></script>
<script type="text/javascript" src="${g.createLink(uri: '/lib/ui-bootstrap-tpls-0.4.0.min.js')}"></script>

<!-- helper libraries -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/sugar-1.3.6-custom.min.js')}"></script>

<script type="text/javascript" src="${g.createLink(uri: '/app/core/js/hawtio-plugin-loader.js')}"></script>

<script type="text/javascript" src="${g.createLink(uri: '/app/app.js')}"></script>

<!-- camel model definition -->
<script type="text/javascript" src="${g.createLink(uri: '/app/camel/js/camelModel.js')}"></script>

<!-- json schema definition -->
<script type="text/javascript" src="${g.createLink(uri: '/app/forms/js/jsonschema.js')}"></script>

<!-- markdown renderer -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/marked.js')}"></script>

<!-- prefix free - handles browser css prefixes -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/prefixfree.min.js')}"></script>

<!-- angular drag/drop directives -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/angular-dragdrop.min.js')}"></script>

<!-- JBoss DMR -->
<script type="text/javascript" src="${g.createLink(uri: '/lib/dmr.js.nocache.js')}"></script>

<!-- google maps -->
<!--
<script src="//maps.googleapis.com/maps/api/js?sensor=false" type="text/javascript"></script>
    -->
</body>
</html>