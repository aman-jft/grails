/// <reference path="../../jmx/js/helpers.ts"/>

module Camel {
  import jmxModule = Jmx;

  var pluginName = 'camel';
  export var jmxDomain = 'org.apache.camel';

  var routeToolBar = "app/camel/html/attributeToolBarRoutes.html";
  var contextToolBar = "app/camel/html/attributeToolBarContext.html";


  angular.module(pluginName, ['bootstrap', 'ui.bootstrap',
            'ui.bootstrap.dialog', 'ui.bootstrap.tabs', 'ui.bootstrap.typeahead', 'ngResource', 'hawtioCore', 'hawtio-ui']).
          config(($routeProvider) => {
            $routeProvider.
                    when('/camel/browseEndpoint', {templateUrl: 'app/camel/html/browseEndpoint.html'}).
                    when('/camel/createEndpoint', {templateUrl: 'app/camel/html/createEndpoint.html'}).
                    when('/camel/routes', {templateUrl: 'app/camel/html/routes.html'}).
                    when('/camel/sendMessage', {templateUrl: 'app/camel/html/sendMessage.html'}).
                    when('/camel/source', {templateUrl: 'app/camel/html/source.html'}).
                    when('/camel/traceRoute', {templateUrl: 'app/camel/html/traceRoute.html'}).
                    when('/camel/debugRoute', {templateUrl: 'app/camel/html/debug.html'}).
                    when('/camel/profileRoute', {templateUrl: 'app/camel/html/profileRoute.html'}).
                    when('/camel/properties', {templateUrl: 'app/camel/html/properties.html'});
          }).
          filter('camelIconClass', () => iconClass).
          filter('lastExchangeCompletedSince', () => lastExchangeCompletedSince).
          filter('lastExchangeFailedSince', () => lastExchangeFailedSince).
          run((workspace:Workspace, jolokia, viewRegistry) => {

            viewRegistry['camel'] = 'app/camel/html/layoutCamelTree.html';

            Jmx.addAttributeToolBar(pluginName, jmxDomain, (selection: NodeSelection) => {
              // TODO there should be a nicer way to do this!
              var typeName = selection.typeName;
              if (typeName) {
                if (typeName.startsWith("context")) return contextToolBar;
                if (typeName.startsWith("route")) return routeToolBar;
              }
              var folderNames = selection.folderNames;
              if (folderNames && selection.domain === jmxDomain) {
                var last = folderNames.last();
                if ("routes" === last)  return routeToolBar;
                if ("context" === last)  return contextToolBar;
              }
              return null;
            });



            // register default attribute views
            var stateTemplate = '<div class="ngCellText pagination-centered" title="{{row.getProperty(col.field)}}"><i class="{{row.getProperty(col.field) | camelIconClass}}"></i></div>';
            var stateColumn = {field: 'State', displayName: 'State',
              cellTemplate: stateTemplate,
              width: 56,
              minWidth: 56,
              maxWidth: 56,
              resizable: false
            };

            var sinceCompletedTemplate = '<div class="ngCellText">{{row.entity | lastExchangeCompletedSince}}</div>';
            var sinceFailedTemplate = '<div class="ngCellText">{{row.entity | lastExchangeFailedSince}}</div>';
            var attributes = workspace.attributeColumnDefs;
            attributes[jmxDomain + "/context/folder"] = [
              stateColumn,
              {field: 'CamelId', displayName: 'Name'},
              {field: 'Uptime', displayName: 'Uptime', visible: false},
              {field: 'CamelVersion', displayName: 'Version', visible: false},
              {field: 'ExchangesCompleted', displayName: 'Completed #'},
              {field: 'LastCompletedSince', displayName: 'Last Completed Since', cellTemplate: sinceCompletedTemplate},
              {field: 'LastExchangeCompletedTimestamp', displayName: 'Last exchange completed timestamp', visible: false},
              {field: 'ExchangesFailed', displayName: 'Failed #'},
              {field: 'LastFailedSince', displayName: 'Last Failed Since', cellTemplate: sinceFailedTemplate},
              {field: 'LastExchangeFailedTimestamp', displayName: 'Last exchange failed timestamp', visible: false},
              {field: 'InflightExchanges', displayName: 'Inflight #'},
              {field: 'MeanProcessingTime', displayName: 'Mean Time'},
              {field: 'MinProcessingTime', displayName: 'Min Time'},
              {field: 'MaxProcessingTime', displayName: 'Max Time'},
              {field: 'TotalProcessingTime', displayName: 'Total Time', visible: false}
            ];
            attributes[jmxDomain + "/components/folder"] = [
              stateColumn,
              {field: 'CamelId', displayName: 'Context'},
              {field: 'ComponentName', displayName: 'Name'}
            ];
            attributes[jmxDomain + "/consumers/folder"] = [
              stateColumn,
              {field: 'CamelId', displayName: 'Context'},
              {field: 'RouteId', displayName: 'Route'},
              {field: 'EndpointUri', displayName: 'Endpoint URI', width: "**"},
              {field: 'Suspended', displayName: 'Suspended', resizable: false},
              {field: 'InflightExchanges', displayName: 'Inflight #'}
            ];
            attributes[jmxDomain + "/processors/folder"] = [
              stateColumn,
              {field: 'CamelId', displayName: 'Context'},
              {field: 'RouteId', displayName: 'Route'},
              {field: 'ProcessorId', displayName: 'Processor'},
              {field: 'ExchangesCompleted', displayName: 'Completed #'},
              {field: 'ExchangesFailed', displayName: 'Failed #'},
              {field: 'MeanProcessingTime', displayName: 'Mean Time'},
              {field: 'MinProcessingTime', displayName: 'Min Time'},
              {field: 'MaxProcessingTime', displayName: 'Max Time'},
              {field: 'TotalProcessingTime', displayName: 'Total Time'}
            ];
            attributes[jmxDomain + "/services/folder"] = [
              stateColumn,
              {field: 'CamelId', displayName: 'Context'},
              {field: 'RouteId', displayName: 'Route'},
              {field: 'Suspended', displayName: 'Suspended', resizable: false},
              {field: 'SupportsSuspended', displayName: 'Can Suspend', resizable: false}
            ];
            attributes[jmxDomain + "/endpoints/folder"] = [
              stateColumn,
              {field: 'CamelId', displayName: 'Context'},
              {field: 'EndpointUri', displayName: 'Endpoint URI', width: "***"},
              {field: 'Singleton', displayName: 'Singleton', resizable: false }
            ];
            attributes[jmxDomain + "/routes/folder"] = [
              stateColumn,
              {field: 'CamelId', displayName: 'Context'},
              {field: 'RouteId', displayName: 'Route'},
              {field: 'ExchangesCompleted', displayName: 'Completed #'},
              {field: 'ExchangesFailed', displayName: 'Failed #'},
              {field: 'MeanProcessingTime', displayName: 'Mean Time'},
              {field: 'MinProcessingTime', displayName: 'Min Time'},
              {field: 'MaxProcessingTime', displayName: 'Max Time'},
              {field: 'TotalProcessingTime', displayName: 'Total Time'}
            ];
            attributes[jmxDomain + "/threadpools/folder"] = [
              {field: 'Id', displayName: 'Id', width: "**"},
              {field: 'ActiveCount', displayName: 'Active #'},
              {field: 'PoolSize', displayName: 'Pool Size'},
              {field: 'CorePoolSize', displayName: 'Core Pool Size'},
              {field: 'TaskQueueSize', displayName: 'Task Queue Size'},
              {field: 'TaskCount', displayName: 'Task #'},
              {field: 'CompletedTaskCount', displayName: 'Completed Task #'}
            ];

            workspace.topLevelTabs.push({
              content: "Camel",
              title: "Manage your Apache Camel applications",
              isValid: (workspace: Workspace) => workspace.treeContainsDomainAndProperties(jmxDomain),
              href: () => "#/jmx/attributes?tab=camel",
              isActive: (workspace: Workspace) => workspace.isTopTabActive("camel")
            });

            // add sub level tabs
            workspace.subLevelTabs.push({
              content: '<i class="icon-picture"></i> Diagram',
              title: "View a diagram of the Camel routes",
              isValid: (workspace: Workspace) => workspace.isRoute(),
              href: () => "#/camel/routes"
            });
            workspace.subLevelTabs.push({
              content: '<i class=" icon-file-alt"></i> Source',
              title: "View the source of the Camel routes",
              isValid: (workspace: Workspace) => workspace.isRoute() || workspace.isRoutesFolder() || workspace.isCamelContext(),
              href: () => "#/camel/source"
            });
            workspace.subLevelTabs.push({
              content: '<i class=" icon-edit"></i> Properties',
              title: "View the pattern properties",
              isValid: (workspace: Workspace) => getSelectedRouteNode(workspace),
              href: () => "#/camel/properties"
            });
            workspace.subLevelTabs.push({
              content: '<i class="icon-envelope"></i> Browse',
              title: "Browse the messages on the endpoint",
              isValid: (workspace: Workspace) => workspace.isEndpoint(),
              href: () => "#/camel/browseEndpoint"
            });
            workspace.subLevelTabs.push({
              content: '<i class="icon-stethoscope"></i> Debug',
              title: "Debug the Camel route",
              isValid: (workspace: Workspace) => workspace.isRoute() && Camel.getSelectionCamelDebugMBean(workspace),
              href: () => "#/camel/debugRoute"
            });
            workspace.subLevelTabs.push({
              content: '<i class="icon-envelope"></i> Trace',
              title: "Trace the messages flowing through the Camel route",
              isValid: (workspace: Workspace) => workspace.isRoute() && Camel.getSelectionCamelTraceMBean(workspace),
              href: () => "#/camel/traceRoute"
            });
            workspace.subLevelTabs.push({
              content: '<i class="icon-bar-chart"></i> Profile',
              title: "Profile the messages flowing through the Camel route",
              isValid: (workspace: Workspace) => workspace.isRoute() && Camel.getSelectionCamelTraceMBean(workspace),
              href: () => "#/camel/profileRoute"
            });
            workspace.subLevelTabs.push({
              content: '<i class="icon-pencil"></i> Send',
              title: "Send a message to this endpoint",
              isValid: (workspace: Workspace) => workspace.isEndpoint(),
              href: () => "#/camel/sendMessage"
            });
            workspace.subLevelTabs.push({
              content: '<i class="icon-plus"></i> Endpoint',
              title: "Create a new endpoint",
              isValid: (workspace: Workspace) => workspace.isEndpointsFolder(),
              href: () => "#/camel/createEndpoint"
            });
          });

  hawtioPluginLoader.addModule(pluginName);

  // register the jmx lazy loader here as it won't have been invoked in the run methot
  hawtioPluginLoader.loadPlugins(() => {
    jmxModule.registerLazyLoadHandler(jmxDomain, (folder:Folder) => {
      if (jmxDomain === folder.domain && "routes" === folder.typeName) {
        return (workspace, folder, onComplete) => {
          if ("routes" === folder.typeName) {
            processRouteXml(workspace, workspace.jolokia, folder, (route) => {
              if (route) {
                addRouteChildren(folder, route);
              }
              onComplete();
            });
          } else {
            onComplete();
          }
        }
      }
      return null;
    });
  });
}
