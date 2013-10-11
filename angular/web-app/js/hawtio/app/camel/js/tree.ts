module Camel {

  export function TreeController($scope, $location:ng.ILocationService, workspace:Workspace) {

    $scope.$on("$routeChangeSuccess", function (event, current, previous) {
      // lets do this asynchronously to avoid Error: $digest already in progress
      setTimeout(updateSelectionFromURL, 50);
    });

    $scope.$watch('workspace.tree', function () {
      reloadFunction();
    });

    $scope.$on('jmxTreeUpdated', function () {
      reloadFunction();
    });

    function reloadFunction() {
      console.log("reloading the camel tree!!!");

      var children = [];
      var domainName = "org.apache.camel";

      // lets pull out each context
      var tree = workspace.tree;
      if (tree) {
        var rootFolder = new Folder("Camel Contexts");
        rootFolder.addClass = "org-apache-camel-context-folder";
        rootFolder.children = children;
        rootFolder.typeName = "context";
        rootFolder.key = "camelContexts";
        rootFolder.domain = domainName;

        var folder = tree.get(domainName);
        if (folder) {
          angular.forEach(folder.children, (value, key) => {
            var entries = value.map;
            if (entries) {
              var contextsFolder = entries["context"];
              var routesNode = entries["routes"];
              var endpointsNode = entries["endpoints"];
              if (contextsFolder) {
                var contextNode = contextsFolder.children[0];
                if (contextNode) {
                  var folder = new Folder(contextNode.title);
                  folder.addClass = "org-apache-camel-context";
                  folder.domain = domainName;
                  folder.objectName = contextNode.objectName;
                  folder.entries = contextNode.entries;
                  folder.typeName = contextNode.typeName;
                  folder.key = contextNode.key;
                  if (routesNode) {
                    var routesFolder = new Folder("Routes");
                    routesFolder.addClass = "org-apache-camel-routes-folder";
                    routesFolder.children = routesNode.children;
                    angular.forEach(routesFolder.children, (n) => n.addClass = "org-apache-camel-routes");
                    folder.children.push(routesFolder);
                    routesFolder.typeName = "routes";
                    routesFolder.key = routesNode.key;
                    routesFolder.domain = routesNode.domain;
                  }
                  if (endpointsNode) {
                    var endpointsFolder = new Folder("Endpoints");
                    endpointsFolder.addClass = "org-apache-camel-endpoints-folder";
                    endpointsFolder.children = endpointsNode.children;
                    angular.forEach(endpointsFolder.children, (n) => {
                      n.addClass = "org-apache-camel-endpoints";
                      if (!getContextId(n)) {
                        n.entries["context"] = contextNode.entries["context"];
                      }
                    });
                    folder.children.push(endpointsFolder);
                    endpointsFolder.entries = contextNode.entries;
                    endpointsFolder.typeName = "endpoints";
                    endpointsFolder.key = endpointsNode.key;
                    endpointsFolder.domain = endpointsNode.domain;
                  }
                  var jmxNode = new Folder("MBeans");

                  // lets add all the entries which are not one context/routes/endpoints
                  angular.forEach(entries, (jmxChild, name) => {
                    if (name !== "context" && name !== "routes" && name !== "endpoints") {
                      jmxNode.children.push(jmxChild);
                    }
                  });

                  if (jmxNode.children.length > 0) {
                    jmxNode.sortChildren(false);
                    folder.children.push(jmxNode);
                  }
                  folder.parent = rootFolder;
                  children.push(folder);
                }
              }
            }
          });
        }

        var treeElement = $("#cameltree");
        Jmx.enableTree($scope, $location, workspace, treeElement, [rootFolder], true);
        /*

         // lets select the first node if we have no selection
         var key = $location.search()['nid'];
         var node = children[0];
         if (!key && node) {
         key = node['key'];
         if (key) {
         var q = $location.search();
         q['nid'] = key;
         $location.search(q);
         }
         }
         if (!key) {
         updateSelectionFromURL();
         }
         */
        // lets do this asynchronously to avoid Error: $digest already in progress
        setTimeout(updateSelectionFromURL, 50);
      }
    }

    function updateSelectionFromURL() {
      Jmx.updateTreeSelectionFromURL($location, $("#cameltree"), true);
    }
  }
}