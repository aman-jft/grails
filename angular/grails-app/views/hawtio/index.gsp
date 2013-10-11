<%--
  Created by IntelliJ IDEA.
  User: prashant
  Date: 11/10/13
  Time: 5:23 PM
  To change this template use File | Settings | File Templates.
--%>

<%@ page contentType="text/html;charset=UTF-8" %>
<html>
<head>

    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hawtio</title>
    <link rel="stylesheet" href="${resource(dir: 'css', file: 'bootstrap.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css', file: 'bootstrap-responsive.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css', file: 'font-awesome.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css', file: 'ui.dynatree.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css', file: 'dynatree-icons.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css', file: 'datatable.bootstrap.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css', file: 'ColReorder.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css/codemirror', file: 'codemirror.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css', file: 'angular-ui.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css', file: 'ng-grid.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css', file: 'jquery.gridster.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css/codemirror/themes', file: 'ambiance.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css/codemirror/themes', file: 'blackboard.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css/codemirror/themes', file: 'eclipse.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css/codemirror/themes', file: 'elegant.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css/codemirror/themes', file: 'erlang-dark.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css/codemirror/themes', file: 'lesser-dark.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css/codemirror/themes', file: 'monokai.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css/codemirror/themes', file: 'neat.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css/codemirror/themes', file: 'night.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css/codemirror/themes', file: 'rubyblue.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css/codemirror/themes', file: 'solarized.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css/codemirror/themes', file: 'twilight.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css/codemirror/themes', file: 'vibrant-ink.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css/codemirror/themes', file: 'xq-dark.css')}" type="text/css"/>
    <link rel="stylesheet" href="${resource(dir: 'css', file: 'toastr.css')}" type="text/css"/>

</head>
<body ng-controller="Core.AppController">
<style>
.ng-cloak {
    display: none;
}
</style>

<!--  navbar-inverse -->
<div id="main-nav" class="navbar navbar-fixed-top" ng-show="!fullScreen()" ng-controller="Core.NavBarController">
    <div class="navbar-inner" ng-cloak class="ng-cloak">
        <div class="container">
            <a class="btn btn-navbar collapsed" data-toggle="collapse" data-target=".nav-collapse">
                <span>{{activeLink()}}</span>
            </a>
            <a class="brand" href="#">
                <img src="img/logo-16px.png"/>
                hawtio
            </a>


            <div class="nav-collapse collapsed">
                <ul class="nav">
                    <li ng-repeat="nav in topLevelTabs()" ng-class="{active : isActive(nav)}" ng-show="isValid(nav)">
                        <a ng-href="{{link(nav)}}" title="{{nav.title}}" data-placement="bottom" ng-bind="nav.content">
                        </a>
                    </li>
                </ul>

                <div class="pull-right">
                    <ul class="nav pull-right">
                        <li ng-class="{active : isActive('#/preferences')}">
                            <a ng-href="{{link('#/preferences')}}" title="Edit your preferences" data-placement="bottom">
                                <i class="icon-cogs"></i>
                            </a>
                        </li>
                        <li ng-class="{active : isActive('#/help')}">
                            <a ng-href="{{link('#/help')}}" title="Read the help about how to use this console"
                               data-placement="bottom">
                                <i class="icon-question-sign"></i>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>

<div id="main" class="container-fluid" ng-controller="Core.ViewController">
    <div ng-include src="viewPartial"></div>
</div>

<div class='instance-name clearfix ng-cloak'>
    <i ng-show="collapse === ''" class="clickable icon-caret-right" title="Hide" ng-click="collapse = 'instance-name-collapse'"></i>
    <i ng-show="collapse === 'instance-name-collapse'" class="clickable icon-caret-left" title="Show" ng-click="collapse = ''"></i>
    <div class='collapse-target' ng-class='collapse'>
        <div ng-show="match" class="host-indicator" style="background: {{match.color}}">{{match.name}}</div>
        <ul class='unstyled inline'>
            <li ng-repeat='title in pageTitle'>{{title}}</li>
        </ul>
    </div>
</div>


<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'd3.v3.min.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'jquery-1.8.2.min.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'jolokia-min.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'cubism.v1.min.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'jolokia-cubism-min.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'json2-min.js')}"></script>


<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'bootstrap.min.js')}"></script>

<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'angular-1.1.4.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'angular-bootstrap.min.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'angular-resource.min.js')}"></script>

<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'ng-grid-2.0.4.min.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'jquery-ui.custom.min.js')}"></script>


<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'jquery.gridster.min.js')}"></script>


<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'jquery.dataTables.min.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'jquery.datatable-bootstrap.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'ColReorder.min.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'KeyTable.min.js')}"></script>


<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'jquery.xml2json.js')}"></script>


<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'jquery.form.min.js')}"></script>


<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'toastr.min.js')}"></script>


<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'dagre.min.js')}"></script>


<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'jquery.jsPlumb-1.4.1-all-min.js')}"></script>


<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib/codemirror', file: 'codemirror.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib/codemirror/addon/edit', file: 'closetag.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib/codemirror/addon/edit', file: 'continuecomment.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib/codemirror/addon/edit', file: 'continuelist.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib/codemirror/addon/edit', file: 'matchbrackets.js')}"></script>

<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib/codemirror/addon/fold', file: 'foldcode.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib/codemirror/addon/format', file: 'formatting.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib/codemirror/mode/javascript', file: 'javascript.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib/codemirror/mode/xml', file: 'xml.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib/codemirror/mode/css', file: 'css.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib/codemirror/mode/markdown', file: 'markdown.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib/codemirror/mode/diff', file: 'diff.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib/codemirror/mode/clike', file: 'clike.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib/codemirror/mode/yaml', file: 'yaml.js')}"></script>


<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'angular-ui.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'ui-bootstrap-0.3.0.min.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'ui-bootstrap-tpls-0.3.0.min.js')}"></script>


<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'sugar-1.3.6-custom.min.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/app/core/js', file: 'hawtio-plugin-loader.js')}"></script>
%{--<script type="text/javascript" src="${resource(dir: 'js/hawtio/app', file: 'app.js')}"></script>--}%
<script type="text/javascript" src="${resource(dir: 'js/hawtio/app/camel/js', file: 'camelModel.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/app/forms/js', file: 'jsonschema.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'marked.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'prefixfree.min.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'angular-dragdrop.min.js')}"></script>
<script type="text/javascript" src="${resource(dir: 'js/hawtio/lib', file: 'dmr.js.nocache.js')}"></script>
<script src="http://maps.googleapis.com/maps/api/js?sensor=false" type="text/javascript"></script>

%{--<g:javascript src="angular.js"/>--}%
%{--<g:javascript src="angular-resource.js"/>--}%
</body>
</html>