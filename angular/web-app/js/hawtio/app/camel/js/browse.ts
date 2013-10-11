module Camel {

  export function BrowseEndpointController($scope, workspace:Workspace, jolokia) {
    $scope.workspace = workspace;

    $scope.forwardDialog = new Core.Dialog();

    $scope.showMessageDetails = false;
    $scope.mode = 'text';

    $scope.gridOptions = Camel.createBrowseGridOptions();

    $scope.$watch('workspace.selection', function () {
      if (workspace.moveIfViewInvalid()) return;
      loadData();
    });


    // TODO can we share these 2 methods from activemq browse / camel browse / came trace?
    $scope.openMessageDialog = (message) => {
      var idx = Core.pathGet(message, ["rowIndex"]);
      $scope.selectRowIndex(idx);
      if ($scope.row) {
        $scope.mode = CodeEditor.detectTextFormat($scope.row.body);
        $scope.showMessageDetails = true;
      }
    };

    $scope.selectRowIndex = (idx) => {
      $scope.rowIndex = idx;
      var selected = $scope.gridOptions.selectedItems;
      selected.splice(0, selected.length);
      if (idx >= 0 && idx < $scope.messages.length) {
        $scope.row = $scope.messages[idx];
        if ($scope.row) {
          selected.push($scope.row);
        }
      } else {
        $scope.row = null;
      }
    };


    $scope.forwardMessagesAndCloseForwardDialog = () => {
      var mbean = getSelectionCamelContextMBean(workspace);
      var selectedItems = $scope.gridOptions.selectedItems;
      var uri = $scope.endpointUri;
      if (mbean && uri && selectedItems && selectedItems.length) {
        //console.log("Creating a new endpoint called: " + uri + " just in case!");
        jolokia.execute(mbean, "createEndpoint(java.lang.String)", uri, onSuccess(intermediateResult));

        $scope.message = "Forwarded " + Core.maybePlural(selectedItems.length, "message" + " to " + uri);
        angular.forEach(selectedItems, (item, idx) => {
          var callback = (idx + 1 < selectedItems.length) ? intermediateResult : operationSuccess;
          var body = item.body;
          var headers = item.headers;
          //console.log("sending to uri " + uri + " headers: " + JSON.stringify(headers) + " body: " + body);
          jolokia.execute(mbean, "sendBodyAndHeaders(java.lang.String, java.lang.Object, java.util.Map)", uri, body, headers, onSuccess(callback));
        });
      }
      $scope.forwardDialog.close();
    };

    $scope.endpointUris = () => {
      var endpointFolder = Camel.getSelectionCamelContextEndpoints(workspace);
      return (endpointFolder) ? endpointFolder.children.map(n => n.title) : [];
    };

    $scope.refresh = loadData;

    function intermediateResult() {
    }

    function operationSuccess() {
      $scope.messageDialog.close();
      $scope.gridOptions.selectedItems.splice(0);
      notification("success", $scope.message);
      setTimeout(loadData, 50);
    }

    function loadData() {
      var mbean = workspace.getSelectedMBeanName();
      if (mbean) {
        var options = onSuccess(populateTable);
        jolokia.execute(mbean, 'browseAllMessagesAsXml(java.lang.Boolean)', true, options);
      }
    }

    function populateTable(response) {
      var data = [];
      if (angular.isString(response)) {
        // lets parse the XML DOM here...
        var doc = $.parseXML(response);
        var allMessages = $(doc).find("message");

        allMessages.each((idx, message) => {
          var messageData = Camel.createMessageFromXml(message);
          data.push(messageData);
        });
      }
      $scope.messages = data;
      Core.$apply($scope);
    }
  }
}
