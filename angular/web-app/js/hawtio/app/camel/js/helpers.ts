module Camel {

  /**
   * Looks up the route XML for the given context and selected route and
   * processes the selected route's XML with the given function
   */
  export function processRouteXml(workspace:Workspace, jolokia, folder, onRoute) {
    var selectedRouteId = getSelectedRouteId(workspace, folder);
    var mbean = getSelectionCamelContextMBean(workspace);

    function onRouteXml(response) {
      var route = null;
      var data = response ? response.value : null;
      if (data) {
        var doc = $.parseXML(data);
        var routes = $(doc).find("route[id='" + selectedRouteId + "']");
        if (routes && routes.length) {
          route = routes[0];
        }
      }
      onRoute(route);
    }

    if (mbean && selectedRouteId) {
      jolokia.request(
              {type: 'exec', mbean: mbean, operation: 'dumpRoutesAsXml()'},
              onSuccess(onRouteXml, {error: onRouteXml}));
    } else {
      if (!selectedRouteId) {
        console.log("No selectedRouteId when trying to lazy load the route!")
      }
      onRoute(null);
    }
  }

  /**
   * Returns the URI string for the given EIP pattern node or null if it is not applicable
   */
  export function getRouteNodeUri(node) {
    var uri = null;
    if (node) {
      uri = node.getAttribute("uri");
      if (!uri) {
        var ref = node.getAttribute("ref");
        if (ref) {
          uri = "ref:" + ref;
        }
      }
    }
    return uri;
  }

  /**
   * Returns the JSON data for the camel folder; extracting it from the associated
   * routeXmlNode or using the previously extracted and/or editted JSON
   */
  export function getRouteFolderJSON(folder, answer = {}) {
    var nodeData = folder["camelNodeData"];
    if (!nodeData) {
      var routeXmlNode = folder["routeXmlNode"];
      if (routeXmlNode) {
        nodeData = Camel.getRouteNodeJSON(routeXmlNode);
      }
      if (!nodeData) {
        nodeData = answer;
      }
      folder["camelNodeData"] = nodeData;
    }
    return nodeData;
  }

  export function getRouteNodeJSON(routeXmlNode, answer = {}) {
    if (routeXmlNode) {
      angular.forEach(routeXmlNode.attributes, (attr) => {
        answer[attr.name] = attr.value;
      });

      // lets not iterate into routes or top level tags
      var localName = routeXmlNode.localName;
      if (localName !== "route" && localName !== "routes" && localName !== "camelContext") {
        // lets look for nested elements and convert those
        // explicitly looking for expressions
        $(routeXmlNode).children("*").each((idx, element) => {
          var nodeName = element.localName;
          var langSettings = Camel.camelLanguageSettings(nodeName);
          if (langSettings) {
            // TODO the expression key could be anything really; how should we know?
            answer["expression"] = {
              language: nodeName,
              expression: element.textContent
            };
          } else {
            if (!isCamelPattern(nodeName)) {
              var nested = getRouteNodeJSON(element);
              if (nested) {
                answer[nodeName] = nested;
              }
            }
          }
        });
      }
    }
    return answer;
  }

  export function increaseIndent(currentIndent:string, indentAmount = "  ") {
    return currentIndent + indentAmount;
  }

  export function setRouteNodeJSON(routeXmlNode, newData, indent) {
    if (routeXmlNode) {
      var childIndent = increaseIndent(indent);
      angular.forEach(newData, (value, key) => {
        if (angular.isObject(value)) {
          // convert languages to the right xml
          var textContent = null;
          if (key === "expression") {
            var languageName = value["language"];
            if (languageName) {
              key = languageName;
              textContent = value["expression"];
              value = angular.copy(value);
              delete value["expression"];
              delete value["language"];
            }
          }
          // TODO deal with nested objects...
          var nested = $(routeXmlNode).children(key);
          var element = null;
          if (!nested || !nested.length) {
            var doc = routeXmlNode.ownerDocument || document;
            routeXmlNode.appendChild(doc.createTextNode("\n" + childIndent));
            element = doc.createElement(key);
            if (textContent) {
              element.appendChild(doc.createTextNode(textContent));
            }
            routeXmlNode.appendChild(element);
          } else {
            element = nested[0];
          }
          setRouteNodeJSON(element, value, childIndent);
          if (textContent) {
            nested.text(textContent);
          }
        } else {
          if (value) {
            if (key.startsWith("_")) {
              // ignore
            } else {
              var text = value.toString();
              routeXmlNode.setAttribute(key, text);
            }
          } else {
            routeXmlNode.removeAttribute(key);
          }
        }
      });
    }
  }

  export function getRouteNodeIcon(nodeSettingsOrXmlNode) {
    var nodeSettings = null;
    if (nodeSettingsOrXmlNode) {
      var nodeName = nodeSettingsOrXmlNode.localName;
      if (nodeName) {
        nodeSettings = getCamelSchema(nodeName);
      } else {
        nodeSettings = nodeSettingsOrXmlNode;
      }
    }
    if (nodeSettings) {
      var imageName = nodeSettings["icon"] || "generic24.png";
      return url("/app/camel/img/" + imageName);
    } else {
      return null;
    }
  }

  /**
   * Returns the cached Camel XML route node stored in the current tree selection Folder
   */
  export function getSelectedRouteNode(workspace:Workspace) {
    var selection = workspace.selection;
    return (selection && jmxDomain === selection.domain) ? selection["routeXmlNode"] : null;
  }

  /**
   * Flushes the cached Camel XML route node stored in the selected tree Folder
   * @param workspace
   */
  export function clearSelectedRouteNode(workspace:Workspace) {
    var selection = workspace.selection;
    if (selection && jmxDomain === selection.domain) {
      delete selection["routeXmlNode"];
    }
  }

  /**
   * Looks up the given node name in the Camel schema
   */
  export function getCamelSchema(nodeIdOrDefinition) {
    return (angular.isObject(nodeIdOrDefinition)) ? nodeIdOrDefinition : Forms.lookupDefinition(nodeIdOrDefinition, _apacheCamelModel);
  }

  /**
   * Returns true if the given nodeId is a route, endpoint or pattern
   * (and not some nested type like a data format)
   */
  export function isCamelPattern(nodeId) {
    return Forms.isJsonType(nodeId, _apacheCamelModel, "org.apache.camel.model.OptionalIdentifiedDefinition");
  }

  /**
   * Returns true if the given node type prefers adding the next sibling as a child
   */
  export function isNextSiblingAddedAsChild(nodeIdOrDefinition) {
    var definition = getCamelSchema(nodeIdOrDefinition);
    if (definition) {
      return definition["nextSiblingAddedAsChild"] || false
    }
    return null;
  }

  export function acceptInput(nodeIdOrDefinition) {
    var definition = getCamelSchema(nodeIdOrDefinition);
    if (definition) {
      return definition["acceptInput"] || false
    }
    return null;
  }

  export function acceptOutput(nodeIdOrDefinition) {
    var definition = getCamelSchema(nodeIdOrDefinition);
    if (definition) {
      return definition["acceptOutput"] || false
    }
    return null;
  }

  /**
   * Looks up the Camel language settings for the given language name
   */
  export function camelLanguageSettings(nodeName) {
    return _apacheCamelModel.languages[nodeName];
  }

  export function isCamelLanguage(nodeName) {
    return (camelLanguageSettings(nodeName) || nodeName === "expression") ? true : false;
  }

  /**
   * Converts the XML string or DOM node to a camel tree
   */
  export function loadCamelTree(xml, key:string) {
    var doc = xml;
    if (angular.isString(xml)) {
      doc = $.parseXML(xml);
    }

    // TODO get id from camelContext
    var id = "camelContext";
    var folder = new Folder(id);
    folder.addClass = "org-apache-camel-context";
    folder.domain = Camel.jmxDomain;
    folder.typeName = "context";

    folder.key = Core.toSafeDomID(key);

    var context = $(doc).find("camelContext");
    if (!context || !context.length) {
      context = $(doc).find("routes");
    }

    if (context && context.length) {
      folder["xmlDocument"] = doc;
      folder["routeXmlNode"] = context;
      $(context).children("route").each((idx, route) => {
        var id = route.getAttribute("id");
        if (!id) {
          id = "route" + idx;
          route.setAttribute("id", id);
        }
        var routeFolder = new Folder(id);
        routeFolder.addClass = "org-apache-camel-route";
        routeFolder.typeName = "routes";
        routeFolder.domain = Camel.jmxDomain;
        routeFolder.key = folder.key + "_" + Core.toSafeDomID(id);
        routeFolder.parent = folder;
        var nodeSettings = getCamelSchema("route");
        if (nodeSettings) {
          var imageUrl = getRouteNodeIcon(nodeSettings);
          routeFolder.tooltip = nodeSettings["tooltip"] || nodeSettings["description"] || id;
          routeFolder.icon = imageUrl;
        }
        folder.children.push(routeFolder);

        addRouteChildren(routeFolder, route);
      });
    }
    return folder;
  }

  /**
   * Adds the route children to the given folder for each step in the route
   */
  export function addRouteChildren(folder:Folder, route) {
    folder.children = [];
    folder["routeXmlNode"] = route;
    route.setAttribute("_cid", folder.key);
    $(route).children("*").each((idx, n) => {
      addRouteChild(folder, n);
    });
  }

  /**
   * Adds a child to the given folder / route
   */
  export function addRouteChild(folder, n) {
    var nodeName = n.localName;
    if (nodeName) {
      var nodeSettings = getCamelSchema(nodeName);
      if (nodeSettings) {
        var imageUrl = getRouteNodeIcon(nodeSettings);

        var child = new Folder(nodeName);
        child.domain = jmxDomain;
        child.typeName = "routeNode";
        updateRouteNodeLabelAndTooltip(child, n, nodeSettings);

        // TODO should maybe auto-generate these?
        child.parent = folder;
        child.folderNames = folder.folderNames;
        var id = n.getAttribute("id") || nodeName;
        var key = folder.key + "_" + Core.toSafeDomID(id);

        // lets find the next key thats unique
        var counter = 1;
        var notFound = true;
        while (notFound) {
          var tmpKey = key + counter;
          if (folder.children.some({key: tmpKey})) {
            counter += 1;
          } else {
            notFound = false;
            key = tmpKey;
          }
        }
        child.key = key;
        child.icon = imageUrl;
        child["routeXmlNode"] = n;
        if (!folder.children) {
          folder.children = [];
        }
        folder.children.push(child);
        addRouteChildren(child, n);
        return child;
      }
    }
    return null;
  }

  export function getFolderCamelNodeId(folder) {
    var answer = Core.pathGet(folder, ["routeXmlNode", "localName"]);
    return ("from" === answer || "to" === answer) ? "endpoint" : answer;
  }

  /**
   * Rebuilds the DOM tree from the tree node and performs all the various hacks
   * to turn the folder / JSON / model into valid camel XML
   * such as renaming language elements from <language expression="foo" language="bar/>
   * to <bar>foo</bar>
   * and changing <endpoint> into either <from> or <to>
   *
   * @param treeNode is either the Node from the tree widget (with the real Folder in the data property) or a Folder
   */
  export function createFolderXmlTree(treeNode, xmlNode, indent = Camel.increaseIndent("")) {
    var folder = treeNode.data || treeNode;
    var count = 0;
    var parentName = getFolderCamelNodeId(folder);
    if (folder) {
      if (!xmlNode) {
        xmlNode = document.createElement(parentName);
        var rootJson = Camel.getRouteFolderJSON(folder);
        if (rootJson) {
          Camel.setRouteNodeJSON(xmlNode, rootJson, indent);
        }
      }
      var doc = xmlNode.ownerDocument || document;
      var namespaceURI = xmlNode.namespaceURI;

      var from = parentName !== "route";
      var childIndent = Camel.increaseIndent(indent);
      angular.forEach(treeNode.children || treeNode.getChildren(), (childTreeNode) => {
        var childFolder = childTreeNode.data || childTreeNode;
        var name = Camel.getFolderCamelNodeId(childFolder);
        var json = Camel.getRouteFolderJSON(childFolder);
        if (name && json) {
          var language = false;
          if (name === "endpoint") {
            if (from) {
              name = "to";
            } else {
              name = "from";
              from = true;
            }
          }
          if (name === "expression") {
            var languageName = json["language"];
            if (languageName) {
              name = languageName;
              language = true;
            }
          }

          // lets create the XML
          xmlNode.appendChild(doc.createTextNode("\n" + childIndent));
          var newNode = doc.createElementNS(namespaceURI, name);

          Camel.setRouteNodeJSON(newNode, json, childIndent);
          xmlNode.appendChild(newNode);
          count += 1;
          createFolderXmlTree(childTreeNode, newNode, childIndent);
        }
      });
      if (count) {
        xmlNode.appendChild(doc.createTextNode("\n" + indent));
      }
    }
    return xmlNode;
  }


  export function updateRouteNodeLabelAndTooltip(folder, routeXmlNode, nodeSettings) {
    var localName = routeXmlNode.localName;
    var id = routeXmlNode.getAttribute("id");
    var label = nodeSettings["title"] || localName;

    // lets use the ID for routes and other things we give an id
    var tooltip = nodeSettings["tooltip"] || nodeSettings["description"] || label;
    if (id) {
      label = id;
    } else {
      var uri = getRouteNodeUri(routeXmlNode);
      if (uri) {
        // Don't use from/to as it gets odd if you drag/drop and reorder
        // label += " " + uri;
        label = uri;
      } else {
        var children = $(routeXmlNode).children("*");
        if (children && children.length) {
          var child = children[0];
          var childName = child.localName;
          var expression = null;
          if (Camel.isCamelLanguage(childName)) {
            expression = child.textContent;
            if (!expression) {
              expression = child.getAttribute("expression");
            }
          }
          if (expression) {
            label += " " + expression;
            tooltip += " " + childName + " expression";
          }
        }
      }
    }
    folder.title = label;
    folder.tooltip = tooltip;
    return label;
  }

  /**
   * Returns the selected camel context mbean for the given selection or null if it cannot be found
   */
    // TODO should be a service
  export function getSelectionCamelContextMBean(workspace:Workspace) {
    if (workspace) {
      var contextId = getContextId(workspace);
      var selection = workspace.selection;
      var tree = workspace.tree;
      if (tree && selection) {
        var domain = selection.domain;
        if (domain && contextId) {
          var result = tree.navigate(domain, contextId, "context");
          if (result && result.children) {
            var contextBean = result.children.first();
            if (contextBean.title) {
              var contextName = contextBean.title;
              return "" + domain + ":context=" + contextId + ',type=context,name="' + contextName + '"';
            }
          }
        }
      }
    }
    return null;
  }

  export function getSelectionCamelContextEndpoints(workspace:Workspace) {
    if (workspace) {
      var contextId = getContextId(workspace);
      var selection = workspace.selection;
      var tree = workspace.tree;
      if (tree && selection) {
        var domain = selection.domain;
        if (domain && contextId) {
          return tree.navigate(domain, contextId, "endpoints");
        }
      }
    }
    return null;
  }

  /**
   * Returns the selected camel trace mbean for the given selection or null if it cannot be found
   */
    // TODO Should be a service
  export function getSelectionCamelTraceMBean(workspace) {
    if (workspace) {
      var contextId = getContextId(workspace);
      var selection = workspace.selection;
      var tree = workspace.tree;
      if (tree && selection) {
        var domain = selection.domain;
        if (domain && contextId) {
          // look for the Camel 2.11 mbean which we prefer
          var result = tree.navigate(domain, contextId, "tracer");
          if (result && result.children) {
            var mbean = result.children.find(m => m.title.startsWith("BacklogTracer"));
            if (mbean) {
              return mbean.objectName;
            }
          }
          // look for the fuse camel fabric mbean
          var fabricResult = tree.navigate(domain, contextId, "fabric");
          if (fabricResult && fabricResult.children) {
            var mbean = fabricResult.children.first();
            return mbean.objectName;
          }
        }
      }
    }
    return null;
  }

  export function getSelectionCamelDebugMBean(workspace) {
    if (workspace) {
      var contextId = getContextId(workspace);
      var selection = workspace.selection;
      var tree = workspace.tree;
      if (tree && selection) {
        var domain = selection.domain;
        if (domain && contextId) {
          var result = tree.navigate(domain, contextId, "tracer");
          if (result && result.children) {
            var mbean = result.children.find(m => m.title.startsWith("BacklogDebugger"));
            if (mbean) {
              return mbean.objectName;
            }
          }
        }
      }
    }
    return null;
  }

  // TODO should be a service
  export function getContextId(workspace:Workspace) {
    var selection = workspace.selection;
    if (selection) {
      var tree = workspace.tree;
      var folderNames = selection.folderNames;
      var entries = selection.entries;
      var contextId;
      if (tree) {
        if (folderNames && folderNames.length > 1) {
          contextId = folderNames[1];
        } else if (entries) {
          contextId = entries["context"];
        }
      }
    }
    return contextId;
  }

  /**
   * Returns true if the state of the item begins with the given state - or one of the given states
   *
   * @param item the item which has a State
   * @param state a value or an array of states
   */
  export function isState(item, state) {
    var value = (item.State || "").toLowerCase();
    if (angular.isArray(state)) {
      return state.any((stateText) => value.startsWith(stateText));
    } else {
      return value.startsWith(state);
    }
  }

  export function iconClass(state:string) {
    if (state) {
      switch (state.toLowerCase()) {
        case 'started':
          return "green icon-play-circle";
        case 'suspended':
          return "icon-pause";
      }
    }
    return "orange icon-off";
  }

  export function lastExchangeCompletedSince(entity) {
    var answer = null;
    if (entity && isState(entity, "started")) {
      answer = entity.lastExchangeCompletedSince;
      if (!answer) {
        answer = sinceFromTimestamp(entity["LastExchangeCompletedTimestamp"]);
        if (answer) {
          entity.lastExchangeCompletedSince = answer;
        }
      }
    }
    return answer;
  }

  export function lastExchangeFailedSince(entity) {
    var answer = null;
    if (entity && isState(entity, "started")) {
      answer = entity.lastExchangeFailedSince;
      if (!answer) {
        answer = sinceFromTimestamp(entity["LastExchangeFailedTimestamp"]);
        if (answer) {
          entity.lastExchangeFailedSince = answer;
        }
      }
    }
    return answer;
  }

  export function sinceFromTimestamp(timestamp:number) {
    if (!timestamp) {
      return null;
    }

    // convert from timestamp to delta since now
    // 2013-04-26T145:01:17+0200
    var time = new Date(timestamp);
    var now = new Date();
    var diff = now.getTime() - time.getTime();
    return diff;
  }

  export function getSelectedRouteId(workspace:Workspace, folder = null) {
    var selection = folder || workspace.selection;
    var selectedRouteId = null;
    if (selection) {
      if (selection && selection.entries) {
        var typeName = selection.entries["type"];
        var name = selection.entries["name"];
        if ("routes" === typeName && name) {
          selectedRouteId = trimQuotes(name);
        }
      }
    }
    return selectedRouteId;
  }

  /**
   * Returns the selected camel route mbean for the given route id
   */
    // TODO Should be a service
  export function getSelectionRouteMBean(workspace:Workspace, routeId:String) {
    if (workspace) {
      var contextId = getContextId(workspace);
      var selection = workspace.selection;
      var tree = workspace.tree;
      if (tree && selection) {
        var domain = selection.domain;
        if (domain && contextId) {
          var result = tree.navigate(domain, contextId, "routes");
          if (result && result.children) {
            var mbean = result.children.find(m => m.title === routeId);
            if (mbean) {
              return mbean.objectName;
            }
          }
        }
      }
    }
    return null;
  }

  export function getCamelVersion(workspace:Workspace, jolokia) {
    var mbean = getSelectionCamelContextMBean(workspace);
    if (mbean) {
      // must use onSuccess(null) that means sync as we need the version asap
      return jolokia.getAttribute(mbean, "CamelVersion", onSuccess(null));
    } else {
      return null;
    }
  }

  export function createMessageFromXml(exchange) {
    var exchangeElement = $(exchange);
    var uid = exchangeElement.children("uid").text();
    var timestamp = exchangeElement.children("timestamp").text();
    var messageData = {
      headers: {},
      headerTypes: {},
      id: null,
      uid: uid,
      timestamp: timestamp,
      headerHtml: ""
    };
    var message = exchangeElement.children("message")[0];
    if (!message) {
      message = exchange;
    }
    var messageElement = $(message);
    var headers = messageElement.find("header");
    var headerHtml = "";
    headers.each((idx, header) => {
      var key = header.getAttribute("key");
      var typeName = header.getAttribute("type");
      var value = header.textContent;
      if (key) {
        if (value) messageData.headers[key] = value;
        if (typeName) messageData.headerTypes[key] = typeName;

        headerHtml += "<tr><td class='property-name'>" + key + "</td>" +
                "<td class='property-value'>" + (value || "") + "</td></tr>";
      }
    });

    messageData.headerHtml = headerHtml;
    var id = messageData.headers["breadcrumbId"];
    if (!id) {
      var postFixes = ["MessageID", "ID", "Path", "Name"];
      angular.forEach(postFixes, (postfix) => {
        if (!id) {
          angular.forEach(messageData.headers, (value, key) => {
            if (!id && key.endsWith(postfix)) {
              id = value;
            }
          });
        }
      });

      // lets find the first header with a name or Path in it
      // if still no value, lets use the first :)
      angular.forEach(messageData.headers, (value, key) => {
        if (!id) id = value;
      });
    }
    messageData.id = id;
    var body = messageElement.children("body")[0];
    if (body) {
      var bodyText = body.textContent;
      var bodyType = body.getAttribute("type");
      messageData["body"] = bodyText;
      messageData["bodyType"] = bodyType;
    }
    return messageData;
  }

  export function createBrowseGridOptions() {
    return {
       selectedItems: [],
       data: 'messages',
       displayFooter: false,
       showFilter: false,
       showColumnMenu: true,
       enableColumnResize: true,
       enableColumnReordering: true,
       filterOptions: {
         filterText: ''
       },
       selectWithCheckboxOnly: true,
       showSelectionCheckbox: true,
       maintainColumnRatios: false,
       columnDefs: [
         {
           field: 'id',
           displayName: 'ID',
           // for ng-grid
           //width: '50%',
           // for hawtio-datatable
           // width: "22em",
           cellTemplate: '<div class="ngCellText"><a ng-click="openMessageDialog(row)">{{row.entity.id}}</a></div>'
         }
       ]
     };
  }

  export function loadRouteXmlNodes($scope, doc, selectedRouteId, nodes, links, width) {
    var allRoutes = $(doc).find("route");
    var routeDelta = width / allRoutes.length;
    var rowX = 0;
    allRoutes.each((idx, route) => {
      var routeId = route.getAttribute("id");
      if (!selectedRouteId || !routeId || selectedRouteId === routeId) {
        Camel.addRouteXmlChildren($scope, route, nodes, links, null, rowX, 0);
        rowX += routeDelta;
      }
    });
  }

  export function addRouteXmlChildren($scope, parent, nodes, links, parentId, parentX, parentY, parentNode = null) {
    var delta = 150;
    var x = parentX;
    var y = parentY + delta;
    var rid = parent.getAttribute("id");
    var siblingNodes = [];
    var parenNodeName = parent.localName;
    $(parent).children().each((idx, route) => {
      var id = nodes.length;
      // from acts as a parent even though its a previous sibling :)
      var nodeId = route.localName;
      if (nodeId === "from" && !parentId) {
        parentId = id;
      }
      var nodeSettings = getCamelSchema(nodeId);
      var node = null;
      if (nodeSettings) {
        var label = nodeSettings["title"] || nodeId;
        var uri = getRouteNodeUri(route);
        if (uri) {
          label += " " + uri;
        }
        var tooltip = nodeSettings["tooltip"] || nodeSettings["description"] || label;
        var imageUrl = getRouteNodeIcon(nodeSettings);
        if ((nodeId === "from" || nodeId === "to") && uri) {
          var idx = uri.indexOf(":");
          if (idx > 0) {
            var componentScheme = uri.substring(0, idx);
            //console.log("lets find the endpoint icon for " + componentScheme);
            if (componentScheme) {
              var value = Camel.getEndpointIcon(componentScheme);
              if (value) {
                imageUrl = url(value);
              }
            }
          }
        }

        //console.log("Image URL is " + imageUrl);
        var cid = route.getAttribute("_cid") || route.getAttribute("id");
        node = { "name": name, "label": label, "group": 1, "id": id, "x": x, "y:": y, "imageUrl": imageUrl, "cid": cid, "tooltip": tooltip};
        if (rid) {
          node["rid"] = rid;
          if (!$scope.routeNodes) $scope.routeNodes = {};
          $scope.routeNodes[rid] = node;
        }
        if (!cid) {
          cid = nodeId + (nodes.length + 1);
        }
        if (cid) {
          node["cid"] = cid;
          if (!$scope.nodes) $scope.nodes = {};
          $scope.nodes[cid] = node;
        }
        // only use the route id on the first from node
        rid = null;
        nodes.push(node);
        if (parentId !== null && parentId !== id) {
          if (siblingNodes.length === 0 || parenNodeName === "choice") {
            links.push({"source": parentId, "target": id, "value": 1});
          } else {
            siblingNodes.forEach(function (nodeId) {
              links.push({"source": nodeId, "target": id, "value": 1});
            });
            siblingNodes.length = 0;
          }
        }
      } else {
        // ignore non EIP nodes, though we should add expressions...
        var langSettings =  Camel.camelLanguageSettings(nodeId);
        if (langSettings && parentNode) {
          // lets add the language kind
          var name = langSettings["name"] || nodeId;
          var text = route.textContent;
          if (text) {
            parentNode["tooltip"] = parentNode["label"] + " " + name + " " + text;
            parentNode["label"] = text;
          } else {
            parentNode["label"] = parentNode["label"] + " " + name;
          }
        }
      }
      var siblings = addRouteXmlChildren($scope, route, nodes, links, id, x, y, node);
      if (parenNodeName === "choice") {
        siblingNodes = siblingNodes.concat(siblings);
        x += delta;
      } else if (nodeId === "choice") {
        siblingNodes = siblings;
        y += delta;
      } else {
        siblingNodes = [nodes.length - 1];
        y += delta;
      }
    });
    return siblingNodes;
  }

  export function getCanvasHeight(canvasDiv) {
    var height = canvasDiv.height();
    if (height < 300) {
      console.log("browse thinks the height is only " + height + " so calculating offset from doc height");
      var offset = canvasDiv.offset();
      height = $(document).height() - 5;
      if (offset) {
        var top = offset['top'];
        if (top) {
          height -= top;
        }
      }
    }
    return height;
  }

  /**
   * Recursively add all the folders which have a cid value into the given map
   */
  export function addFoldersToIndex(folder:Folder, map = {}) {
    if (folder) {
      var key = folder.key
      if (key) {
        map[key] = folder;
      }
      angular.forEach(folder.children, (child) => addFoldersToIndex(child, map));
    }
    return map;
  }



  /**
   * Re-generates the XML document using the given Tree widget Node or Folder as the source
   */
  export function generateXmlFromFolder(treeNode) {
    var folder = (treeNode && treeNode.data) ? treeNode.data : treeNode;
    if (!folder) return null;
    var doc = folder["xmlDocument"];
    var context = folder["routeXmlNode"];

    if (context && context.length) {
      var element = context[0];
      var children = element.childNodes;
      var routeIndices = [];
      for (var i = 0; i < children.length; i++) {
        var node = children[i];
        var name = node.localName;
        if ("route" === name && parent) {
          routeIndices.push(i);
        }
      }

      // lets go backwards removing all the text nodes on either side of each route along with the route
      while (routeIndices.length) {
        var idx = routeIndices.pop();
        var nextIndex = idx + 1;
        while (true) {
          var node = element.childNodes[nextIndex];
          if (Core.isTextNode(node)) {
            element.removeChild(node);
          } else {
            break;
          }
        }
        if (idx < element.childNodes.length) {
          element.removeChild(element.childNodes[idx]);
        }
        for (var i = idx - 1; i >= 0; i--) {
          var node = element.childNodes[i];
          if (Core.isTextNode(node)) {
            element.removeChild(node);
          } else {
            break;
          }
        }
      }
      Camel.createFolderXmlTree(treeNode, context[0]);
    }
    return doc;
  }
}