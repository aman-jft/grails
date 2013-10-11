interface MenuItem {
  content: string;
  title?: string;
  isValid?: (Workspace) => any;
  isActive?: (Workspace) => bool;
  href: () => any;
}


class Workspace {
  public operationCounter = 0;
  public selection:NodeSelection;
  public tree:any = new Folder('MBeans');
  public treeResponse = {};
  public mbeanTypesToDomain = {};
  public mbeanServicesToDomain = {};
  public attributeColumnDefs = {};
  public treePostProcessors = [];
  public topLevelTabs = [];
  public subLevelTabs = [];
  public keyToNodeMap = {};
  public pluginRegisterHandle = null;
  public pluginUpdateCounter = null;
  public treeWatchRegisterHandle = null;
  public treeWatcherCounter = null;
  public treeElement = null;

  constructor(public jolokia,
              public jmxTreeLazyLoadRegistry,
              public $location,
              public $compile:ng.ICompileService,
              public $templateCache:ng.ITemplateCacheService, 
              public localStorage:WindowLocalStorage,
              public $rootScope) {

  }

  /**
   * Creates a shallow copy child workspace with its own selection and location
   */
  public createChildWorkspace(location): Workspace {
    var child = new Workspace(this.jolokia, this.jmxTreeLazyLoadRegistry, this.$location, this.$compile, this.$templateCache, this.localStorage, this.$rootScope);
    // lets copy across all the properties just in case
    angular.forEach(this, (value, key) => child[key] = value);
    child.$location = location;
    return child;
  }

  getLocalStorage(key:string) {
    return this.localStorage[key];
  }

  setLocalStorage(key:string, value:any) {
    this.localStorage[key] = value;
  }

  public loadTree() {
    // Make an initial blocking call to ensure the JMX tree is populated while the
    // app is initializing...
    var options = onSuccess(null, {ignoreErrors: true, maxDepth: 2});
    var data = this.jolokia.list(null, options);
    this.populateTree({
      value: data
    });
    // we now only reload the tree if the TreeWatcher mbean is present...
    // Core.register(this.jolokia, this, {type: 'list', maxDepth: 2}, onSuccess(angular.bind(this, this.populateTree), {maxDepth: 2}));
  }

  /**
   * Adds a post processor of the tree to swizzle the tree metadata after loading
   * such as correcting any typeName values or CSS styles by hand
   */
  public addTreePostProcessor(processor) {
    this.treePostProcessors.push(processor);

    var tree = this.tree;
    if (tree) {
      // the tree is loaded already so lets process it now :)
      processor(tree);
    }
  }

  public maybeMonitorPlugins() {
    if (this.treeContainsDomainAndProperties("hawtio", {type: "registry"})) {
      if (this.pluginRegisterHandle === null) {
        this.pluginRegisterHandle = this.jolokia.register(angular.bind(this, this.maybeUpdatePlugins), {
          type: "read",
          mbean: "hawtio:type=registry",
          attribute: "UpdateCounter"
        });
      }
    } else {
      if (this.pluginRegisterHandle !== null) {
        this.jolokia.unregister(this.pluginRegisterHandle);
        this.pluginRegisterHandle = null;
        this.pluginUpdateCounter = null;
      }
    }

    // lets also listen to see if we have a JMX tree watcher
    if (this.treeContainsDomainAndProperties("io.hawt.jmx", {type: "TreeWatcher"})) {
      if (this.treeWatchRegisterHandle === null) {
        this.treeWatchRegisterHandle = this.jolokia.register(angular.bind(this, this.maybeReloadTree), {
          type: "read",
          mbean: "io.hawt.jmx:type=TreeWatcher",
          attribute: "Counter"
        });
      } else {
        // lets keep using the existing register handle

        /** we don't need to unregister lets keep using it
        if (this.treeWatchRegisterHandle !== null) {
          this.jolokia.unregister(this.treeWatchRegisterHandle);
          this.treeWatchRegisterHandle = null;
          this.treeWatcherCounter = null;
        }
        */
      }
    }
  }

  public maybeUpdatePlugins(response) {
    if (this.pluginUpdateCounter === null) {
      this.pluginUpdateCounter = response.value;
      return;
    }
    if (this.pluginUpdateCounter !== response.value) {
      if (localStorage['autoRefresh'] === "true") {
        window.location.reload();
      }
    }
  }

  public maybeReloadTree(response) {
    var counter = response.value;
    if (this.treeWatcherCounter === null) {
      this.treeWatcherCounter = counter;
      return;
    }
    if (this.treeWatcherCounter !== counter) {
      this.treeWatcherCounter = counter;
      var workspace = this;
      function wrapInValue(response) {
        var wrapper = {
          value: response
        };
        workspace.populateTree(wrapper);
      }
      this.jolokia.list(null, onSuccess(wrapInValue, {ignoreErrors: true, maxDepth: 2}));
    }
  }

  public folderGetOrElse(folder, value) {
    if (folder) {
      try {
        return folder.getOrElse(value);
      } catch (e) {
        console.log("Failed to find value " + value + " on folder " + folder);
      }
    }
    return null;
  }

  public populateTree(response) {
    if (!Object.equal(this.treeResponse, response.value)) {
      this.treeResponse = response.value;
      console.log("JMX tree has been loaded!");

      var rootId = 'root';
      var separator = '-';
      this.mbeanTypesToDomain = {};
      this.mbeanServicesToDomain = {};
      this.keyToNodeMap = {};
      var tree = new Folder('MBeans');
      tree.key = rootId;
      var domains = response.value;
      for (var domain in domains) {
        var domainClass = escapeDots(domain);
        var mbeans = domains[domain];
        for (var path in mbeans) {
          var entries = {};
          var folder = this.folderGetOrElse(tree, domain);
          //if (!folder) continue;
          folder.domain = domain;
          if (!folder.key) {
            folder.key = rootId + separator + domain;
          }
          var folderNames = [domain];
          folder.folderNames = folderNames;
          folderNames = folderNames.clone();
          var items = path.split(',');
          var paths = [];
          var typeName = null;
          var serviceName = null;
          items.forEach(item => {
            var kv = item.split('=');
            var key = kv[0];
            var value = kv[1] || key;
            entries[key] = value;
            var moveToFront = false;
            var lowerKey = key.toLowerCase();
            if (lowerKey === "type") {
              typeName = value;
              // if the type name value already exists in the root node
              // of the domain then lets move this property around too
              if (folder.map[value]) {
                moveToFront = true;
              }
            }
            if (lowerKey === "service") {
              serviceName = value;
            }
            if (moveToFront) {
              paths.splice(0, 0, value);
            } else {
              paths.push(value);
            }
          });


        var configureFolder = function(folder: Folder, name: string) {
            folder.domain = domain;
            if (!folder.key) {
              folder.key = rootId + separator + folderNames.join(separator);
            }
            this.keyToNodeMap[folder.key] = folder;
            folder.folderNames = folderNames.clone();
            //var classes = escapeDots(folder.key);
            var classes = "";
            var entries = folder.entries;
            var entryKeys = Object.keys(entries).filter((n) => n.toLowerCase().indexOf("type") >= 0);
            if (entryKeys.length) {
              angular.forEach(entryKeys, (entryKey) => {
                var entryValue = entries[entryKey];
                if (!folder.ancestorHasEntry(entryKey, entryValue)) {
                  classes += " " + domainClass + separator + entryValue;
                }
              });
            } else {
              var kindName = folderNames.last();
              /*if (folder.parent && folder.parent.title === typeName) {
               kindName = typeName;
               } else */
              if (kindName === name) {
                kindName += "-folder";
              }
              if (kindName) {
                classes += " " + domainClass + separator + kindName;
              }
            }
            folder.addClass = escapeTreeCssStyles(classes);
            return folder;
          };

          var lastPath = paths.pop();
          var ws = this
          paths.each((value) => {
            folder = ws.folderGetOrElse(folder, value);
            if (folder) {
              folderNames.push(value);
              angular.bind(ws, configureFolder, folder, value)();
            }
          });
          var key = rootId + separator + folderNames.join(separator) + separator + lastPath;
          var objectName = domain + ":" + path;

          if (folder) {
            folder = this.folderGetOrElse(folder, lastPath);
            if (folder) {
              // lets add the various data into the folder
              folder.entries = entries;
              folder.key = key;
              angular.bind(this, configureFolder, folder, lastPath)();
              folder.title = trimQuotes(lastPath);
              folder.objectName = objectName;
              folder.typeName = typeName;

              var addFolderByDomain = function(owner, typeName) {
                  var map = owner[typeName];
                  if (!map) {
                    map = {};
                    owner[typeName] = map;
                  }
                  var value = map[domain];
                  if (!value) {
                    map[domain] = folder;
                  } else {
                    var array = null;
                    if (angular.isArray(value)) {
                      array = value;
                    } else {
                      array = [value];
                      map[domain] = array;
                    }
                    array.push(folder);
                  }
                };

              if (serviceName) {
                angular.bind(this, addFolderByDomain, this.mbeanServicesToDomain, serviceName)();
              }
              if (typeName) {
                angular.bind(this, addFolderByDomain, this.mbeanTypesToDomain, typeName)();
              }
            }
          } else {
            console.log("No folder found for lastPath: " + lastPath);
          }
        }
      }

      tree.sortChildren(true);

      // now lets mark the nodes with no children as lazy loading...
      this.enableLazyLoading(tree);
      this.tree = tree;

      var processors = this.treePostProcessors;
      angular.forEach(processors, (processor) => processor(tree));

      this.maybeMonitorPlugins();

      this.$rootScope.$broadcast('jmxTreeUpdated');
    }
  }

  private enableLazyLoading(folder: Folder) {
    var children = folder.children;
    if (children && children.length) {
      angular.forEach(children, (child) => {
        this.enableLazyLoading(child);
      })
    } else {
      // we have no children so enable lazy loading if we have a custom loader registered
      var lazyFunction = Jmx.findLazyLoadingFunction(this, folder);
      if (lazyFunction) {
        folder.isLazy = true;
      }
    }
  }

  /**
   * Returns the hash query argument to append to URL links
   */
  public hash() {
    var hash = this.$location.search();
    var params = Core.hashToString(hash);
    if (params) {
      return "?" + params;
    }
    return "";
  }

  /**
   * Returns the currently active tab
   * @param href
   * @return {*}
   */
  public getActiveTab() {
    var workspace = this;
    return this.topLevelTabs.find((tab) => {
      if (!angular.isDefined(tab.isActive)) {
        return workspace.isLinkActive(tab.href());
      } else {
        return tab.isActive(workspace);
      }
    });
  }

  /**
   * Returns true if the given link is active. The link can omit the leading # or / if necessary.
   * The query parameters of the URL are ignored in the comparison.
   *
   * @param href
   * @return true if the given link is active
   */
  public isLinkActive(href:string):bool {
    // lets trim the leading slash
    var pathName = Core.trimLeading((this.$location.path() || '/'), "#");
    pathName = Core.trimLeading(pathName, "/");

    var link = Core.trimLeading(href, "#");
    link = Core.trimLeading(link, "/");
    // strip any query arguments
    var idx = link.indexOf('?');
    if (idx >= 0) {
      link = link.substring(0, idx);
    }
    if (!pathName.length) {
      return link === pathName;
    } else {
      return pathName.startsWith(link);
    }
  }

  /**
   * Returns true if the tab query parameter is active or the URL starts with the given path
   */
  public isTopTabActive(path:string):bool {
    var tab = this.$location.search()['tab'];
    if (angular.isString(tab)) {
      return tab.startsWith(path);
    }
    return this.isLinkActive(path);
  }

  /**
   * Returns the selected mbean name if there is one
   */
  public getSelectedMBeanName():string {
    var selection = this.selection;
    if (selection) {
      return selection.objectName;
    }
    return null;
  }

  /**
   * Returns true if the path is valid for the current selection
   */
  public validSelection(uri:string) {
    var workspace = this;
    var filter = (t) => {
      var fn = t.href;
      if (fn) {
        var href = fn();
        if (href) {
          if (href.startsWith("#/")) {
            href = href.substring(2);
          }
          return href === uri;
        }
      }
      return false;
    };
    var tab = this.subLevelTabs.find(filter);
    if (!tab) {
      tab = this.topLevelTabs.find(filter);
    }
    if (tab) {
      //console.log("Found tab " + JSON.stringify(tab));
      var validFn = tab.isValid;
      return !angular.isDefined(validFn) || validFn(workspace);
    } else {
      console.log("Could not find tab for " + uri);
      return false;
    }
/*
    var value = this.uriValidations[uri];
    if (value) {
      if (angular.isFunction(value)) {
        return value();
      }
    }
    return true;
*/
  }

  /**
   * In cases where we have just deleted something we typically want to change
   * the selection to the parent node
   */
  public removeAndSelectParentNode() {
    var selection = this.selection;
    if (selection) {
      var parent = selection.parent;
      if (parent) {
        // lets remove the selection from the parent so we don't do any more JMX attribute queries on the children
        // or include it in table views etc
        // would be nice to eagerly remove the tree node too?
        var idx = parent.children.indexOf(selection);
        if (idx < 0) {
          idx = parent.children.findIndex({key: selection.key});
        }
        if (idx >= 0) {
          parent.children.splice(idx, 1);
        }
        this.updateSelectionNode(parent);
      }
    }
  }

  public selectParentNode() {
    var selection = this.selection;
    if (selection) {
      var parent = selection.parent;
      if (parent) {
        this.updateSelectionNode(parent);
      }
    }
  }

  /**
   * Returns the view configuration key for the kind of selection
   * for example based on the domain and the node type
   */
  public selectionViewConfigKey():string {
    return this.selectionConfigKey("view/");
  }

  /**
   * Returns a configuration key for a node which is usually of the form
   * domain/typeName or for folders with no type, domain/name/folder
   */
  public selectionConfigKey(prefix: string = ""):string {
    var key = null;
    var selection = this.selection;
    if (selection) {
      // lets make a unique string for the kind of select
      key = prefix + selection.domain;
      var typeName = selection.typeName;
      if (!typeName) {
        typeName = selection.title;
      }
      key += "/" + typeName;
      if (selection.isFolder()) {
        key += "/folder";
      }
    }
    return key;
  }

  public moveIfViewInvalid() {
    var workspace = this;
    var uri = Core.trimLeading(this.$location.path(), "/");
    if (this.selection) {
      var key = this.selectionViewConfigKey();
      if (this.validSelection(uri)) {
        // lets remember the previous selection
        this.setLocalStorage(key, uri);
        return false;
      } else {
        console.log("the uri '" + uri + "' is not valid for this selection");
        // lets look up the previous preferred value for this type
        var defaultPath = this.getLocalStorage(key);
        if (!defaultPath || !this.validSelection(defaultPath)) {
          // lets find the first path we can find which is valid
          defaultPath = null;
          angular.forEach(this.subLevelTabs, (tab) => {
            var fn = tab.isValid;
            if (!defaultPath && tab.href && angular.isDefined(fn) && fn(workspace)) {
              defaultPath = tab.href();
            }
          });
        }
        if (!defaultPath) {
          defaultPath = "#/jmx/help";
        }
        console.log("moving the URL to be " + defaultPath);
        if (defaultPath.startsWith("#")) {
          defaultPath = defaultPath.substring(1);
        }
        this.$location.path(defaultPath);
        return true;
      }
    } else {
      return false;
    }
  }

  public updateSelectionNode(node) {
    var originalSelection = this.selection;
    this.selection = <NodeSelection> node;
    var key = null;
    if (node) {
      key = node['key'];
    }
    var $location = this.$location;
    var q = $location.search();
    if (key) {
      q['nid'] = key
    }
    $location.search(q);

    // if we have updated the selection (rather than just loaded a page)
    // lets use the previous preferred view - otherwise we may be loading
    // a page from a bookmark so lets not change the view :)
    if (originalSelection) {
      key = this.selectionViewConfigKey();
      if (key) {
        var defaultPath = this.getLocalStorage(key);
        if (defaultPath) {
          this.$location.path(defaultPath);
        }
      }
    }
  }

  /**
   * Redraws the tree widget
   */
  public redrawTree() {
    var treeElement = this.treeElement;
    if (treeElement) {
      treeElement.dynatree("getTree").reload();
    }
  }


  /**
   * Expand / collapse the current active node
   */
  public expandSelection(flag) {
    var treeElement = this.treeElement;
    if (treeElement) {
      var node = treeElement.dynatree("getActiveNode");
      if (node) {
        node.expand(flag);
      }
    }
  }

  private matchesProperties(entries, properties) {
    if (!entries) return false;
    for (var key in properties) {
      var value = properties[key];
      if (!value || entries[key] !== value) {
        return false;
      }
    }
    return true;
  }

  public treeContainsDomainAndProperties(domainName, properties = null) {
    var workspace = this;
    var tree = workspace.tree;
    if (tree) {
      var folder = tree.get(domainName);
      if (folder) {
        if (properties) {
          var children = folder.children || [];
          return children.some((node) => this.matchesProperties(node.entries, properties));
        }
        return true;
      } else {
        // console.log("no hasMBean for " + objectName + " in tree " + tree);
      }
    } else {
      // console.log("workspace has no tree! returning false for hasMBean " + objectName);
    }
    return false;
  }

  private matches(folder, properties, propertiesCount) {
    if (folder) {
      var entries = folder.entries;
      if (properties) {
        if (!entries) return false;
        for (var key in properties) {
          var value = properties[key];
          if (!value || entries[key] !== value) {
            return false;
          }
        }
      }
      if (propertiesCount) {
        return entries && Object.keys(entries).length === propertiesCount;
      }
      return true;
    }
    return false;
  }

  // only display stuff if we have an mbean with the given properties
  public hasDomainAndProperties(domainName, properties = null, propertiesCount = null) {
    var node = this.selection;
    if (node) {
      return this.matches(node, properties, propertiesCount) && node.domain === domainName;
    }
    return false;
  }

  // only display stuff if we have an mbean with the given properties
  public findMBeanWithProperties(domainName, properties = null, propertiesCount = null) {
    var tree = this.tree;
    if (tree) {
        return this.findChildMBeanWithProperties(tree.get(domainName), properties, propertiesCount);
    }
    return null;
  }

  public findChildMBeanWithProperties(folder, properties = null, propertiesCount = null) {
    var workspace = this;
    if (folder) {
      var children = folder.children;
      if (children) {
        var answer = children.find(node => this.matches(node, properties, propertiesCount));
        if (answer) {
          return answer;
        }
        return children.map(node => workspace.findChildMBeanWithProperties(node, properties, propertiesCount)).find(node => node);
      }
    }
    return null;
  }


  public selectionHasDomainAndLastFolderName(objectName: string, lastName: string) {
    var lastNameLower = (lastName || "").toLowerCase();
    function isName(name) {
      return (name || "").toLowerCase() === lastNameLower
    }
    var node = this.selection;
    if (node) {
      if (objectName === node.domain) {
        var folders = node.folderNames;
        if (folders) {
          var last = folders.last();
          return (isName(last) || isName(node.title)) && node.isFolder() && !node.objectName;
        }
      }
    }
    return false;
  }

  public selectionHasDomainAndType(objectName: string, typeName: string) {
    var node = this.selection;
    if (node) {
      return objectName === node.domain && typeName === node.typeName;
    }
    return false;
  }

  hasFabricMBean() {
    return this.hasDomainAndProperties('org.fusesource.fabric', {type: 'Fabric'});
  }

  isFabricFolder() {
    return this.hasDomainAndProperties('org.fusesource.fabric');
  }

  isCamelContext() {
    return this.hasDomainAndProperties('org.apache.camel', {type: 'context'});
  }

  isCamelFolder() {
    return this.hasDomainAndProperties('org.apache.camel');
  }

  isEndpointsFolder() {
    return this.selectionHasDomainAndLastFolderName('org.apache.camel', 'endpoints');
  }

  isEndpoint() {
    return this.hasDomainAndProperties('org.apache.camel', {type: 'endpoints'});
  }

  isRoutesFolder() {
    return this.selectionHasDomainAndLastFolderName('org.apache.camel', 'routes')
  }

  isRoute() {
    return this.hasDomainAndProperties('org.apache.camel', {type: 'routes'});
  }

  isOsgiFolder() {
    return this.hasDomainAndProperties('osgi.core');
  }
  isKarafFolder() {
        return this.hasDomainAndProperties('org.apache.karaf');
  }

    isOsgiCompendiumFolder() {
        return this.hasDomainAndProperties('osgi.compendium');
    }
}

