
module Camel {
  export function CamelController($scope, $element, workspace:Workspace, jolokia) {
    $scope.routes = [];
    $scope.routeNodes = {};

    $scope.$on("$routeChangeSuccess", function (event, current, previous) {
      // lets do this asynchronously to avoid Error: $digest already in progress
      setTimeout(updateRoutes, 50);
    });

    $scope.$watch('workspace.selection', function () {
      if (workspace.moveIfViewInvalid()) return;
      updateRoutes();
    });

    $scope.$watch('nodeXmlNode', function () {
      if (workspace.moveIfViewInvalid()) return;
      updateRoutes();
    });

    function updateRoutes() {
      var routeXmlNode = null;
      if (!$scope.ignoreRouteXmlNode) {
        routeXmlNode = getSelectedRouteNode(workspace);
        if (!routeXmlNode) {
          routeXmlNode = $scope.nodeXmlNode;
        }
        if (routeXmlNode && routeXmlNode.localName !== "route") {
          var wrapper = document.createElement("route");
          wrapper.appendChild(routeXmlNode.cloneNode(true));
          routeXmlNode = wrapper;
        }
      }
      $scope.mbean = getSelectionCamelContextMBean(workspace);
      if (routeXmlNode) {
        // lets show the remaining parts of the diagram of this route node
        $scope.nodes = {};
        var nodes = [];
        var links = [];
        Camel.addRouteXmlChildren($scope, routeXmlNode, nodes, links, null, 0, 0);
        showGraph(nodes, links);
      } else if ($scope.mbean) {
        jolokia.request(
                {type: 'exec', mbean: $scope.mbean, operation: 'dumpRoutesAsXml()'},
                onSuccess(populateTable));
      } else {
        console.log("No camel context bean!")
      }
    }

    var populateTable = function (response) {
      var data = response.value;
      // routes is the xml data of the routes
      $scope.routes = data;
      // nodes and routeNodes is the GUI nodes for the processors and routes shown in the diagram
      $scope.nodes = {};
      $scope.routeNodes = {};
      var nodes = [];
      var links = [];
      var selectedRouteId = getSelectedRouteId(workspace);
      if (data) {
        var doc = $.parseXML(data);
        Camel.loadRouteXmlNodes($scope, doc, selectedRouteId, nodes, links, getWidth());
        showGraph(nodes, links);
      } else {
        console.log("No data from route XML!")
      }
      Core.$apply($scope);
    };


    var postfix = " selected";

    function isSelected(node) {
      if (node) {
        var className = node.getAttribute("class");
        return className && className.endsWith(postfix);
      }
      return false;
    }

    function setSelected(node, flag) {
      var answer = false;
      if (node) {
        var className = node.getAttribute("class");
        var selected = className && className.endsWith(postfix);
        if (selected) {
          className = className.substring(0, className.length - postfix.length);
        } else {
          if (!flag) {
            // no need to change!
            return answer;
          }
          className = className + postfix;
          answer = true;
        }
        node.setAttribute("class", className);
      }
      return answer;
    }

    function showGraph(nodes, links) {
      var canvasDiv = $($element);
      var width = getWidth();
      var height = getHeight();
      var svg = canvasDiv.children("svg")[0];
      $scope.graphData = Core.dagreLayoutGraph(nodes, links, width, height, svg);

      var nodes = canvasDiv.find("g.node");
      nodes.click(function() {
        var selected = isSelected(this);

        // lets clear all selected flags
        nodes.each((idx, element) => {
          setSelected(element, false);
        });

        var cid = null;
        if (!selected) {
          cid = this.getAttribute("data-cid");
          setSelected(this, true);
        }
        $scope.$emit("camel.diagram.selectedNodeId", cid);
        Core.$apply($scope);
      });

      if ($scope.mbean) {
        Core.register(jolokia, $scope, {
          type: 'exec', mbean: $scope.mbean,
          operation: 'dumpRoutesStatsAsXml',
          arguments: [true, true]
          // the dumpRoutesStatsAsXml is not available in all Camel versions so do not barf on errors
        }, onSuccess(statsCallback, {silent: true, error: false}));
      }
      $scope.$emit("camel.diagram.layoutComplete");
      return width;
    }

    function getWidth() {
      var canvasDiv = $($element);
      return canvasDiv.width();
    }

    function getHeight() {
      var canvasDiv = $($element);
      return getCanvasHeight(canvasDiv);
    }

    function statsCallback(response) {
      var data = response.value;
      if (data) {
        var doc = $.parseXML(data);

        var allStats = $(doc).find("routeStat");
        allStats.each((idx, stat) => {
          addTooltipToNode(true, stat);
        });

        var allStats = $(doc).find("processorStat");
        allStats.each((idx, stat) => {
          addTooltipToNode(false, stat);
        });

        // now lets try update the graph
        Core.dagreUpdateGraphData($scope.graphData);
      }

      function addTooltipToNode(isRoute, stat) {
        // we could have used a function instead of the boolean isRoute parameter (but sometimes that is easier)
        var id = stat.getAttribute("id");
        var completed = stat.getAttribute("exchangesCompleted");
        var tooltip = "";
        if (id && completed) {
          var node = isRoute ? $scope.routeNodes[id]: $scope.nodes[id];
          if (node) {
            var total = 0 + parseInt(completed);
            var failed = stat.getAttribute("exchangesFailed");
            if (failed) {
              total += parseInt(failed);
            }
            var last = stat.getAttribute("lastProcessingTime");
            var mean = stat.getAttribute("meanProcessingTime");
            var min = stat.getAttribute("minProcessingTime");
            var max = stat.getAttribute("maxProcessingTime");
            tooltip = "last: " + last + " (ms)\nmean: " + mean + " (ms)\nmin: " + min + " (ms)\nmax: " + max + " (ms)";

            node["counter"] = total;
            node["tooltip"] = tooltip;
          } else {
            // we are probably not showing the route for these stats
            //console.log("Warning, could not find " + id);
          }
        }
      }
    }

  }

}



