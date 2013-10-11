var logQueryMBean = 'org.fusesource.insight:type=LogQuery';

var _urlPrefix: string = null;

var numberTypeNames = {
  'byte': true,
  'short': true,
  'int': true,
  'long': true,
  'float': true,
  'double': true,
  'java.lang.Byte': true,
  'java.lang.Short': true,
  'java.lang.Integer': true,
  'java.lang.Long': true,
  'java.lang.Float': true,
  'java.lang.Double': true
};

/**
 * Returns the number of lines in the given text
 */
function lineCount(value): number {
  var rows = 0;
  if (value) {
    rows = 1;
    value.toString().each(/\n/, () => rows++);
  }
  return rows;
}

function url(path: string): string {
  if (path) {
    if (path.startsWith && path.startsWith("/")) {
      if (_urlPrefix === null) {
        _urlPrefix = window.location.pathname || "";
        if (_urlPrefix) {
          var idx = _urlPrefix.lastIndexOf("/");
          if (idx >= 0) {
            _urlPrefix = _urlPrefix.substring(0, idx);
          }
        }
        console.log("URI prefix is " + _urlPrefix);
      }
      return _urlPrefix + path;
    }
  }
  return path;
}

function humanizeValue(value:any):string {
  if (value) {
    var text = value.toString();
    return trimQuotes(text.underscore().humanize());
  }
  return value;
}

function trimQuotes(text:string) {
  while (text.endsWith('"') || text.endsWith("'")) {
    text = text.substring(0, text.length - 1);
  }
  while (text.startsWith('"') || text.startsWith("'")) {
    text = text.substring(1, text.length);
  }
  return text;
}

/**
 * Converts the given value to an array of query arguments.
 *
 * If the value is null an empty array is returned.
 * If the value is a non empty string then the string is split by commas
 */
function toSearchArgumentArray(value): string[] {
  if (value) {
    if (angular.isArray(value)) return value;
    if (angular.isString(value)) return value.split(',');
  }
  return [];
}

function folderMatchesPatterns(node, patterns) {
  if (node) {
    var folderNames = node.folderNames;
    if (folderNames) {
      return patterns.any((ignorePaths) => {
        for (var i = 0; i < ignorePaths.length; i++) {
          var folderName = folderNames[i];
          var ignorePath = ignorePaths[i];
          if (!folderName) return false;
          var idx = ignorePath.indexOf(folderName);
          if (idx < 0) {
            return false;
          }
        }
        return true;
      });
    }
  }
  return false;
}

function scopeStoreJolokiaHandle($scope, jolokia, jolokiaHandle) {
  // TODO do we even need to store the jolokiaHandle in the scope?
  if (jolokiaHandle) {
    $scope.$on('$destroy', function () {
      closeHandle($scope, jolokia)
    });
    $scope.jolokiaHandle = jolokiaHandle;
  }
}

function closeHandle($scope, jolokia) {
  var jolokiaHandle = $scope.jolokiaHandle
  if (jolokiaHandle) {
    //console.log('Closing the handle ' + jolokiaHandle);
    jolokia.unregister(jolokiaHandle);
    $scope.jolokiaHandle = null;
  }
}

/**
 * Pass in null for the success function to switch to sync mode
 */
function onSuccess(fn, options = {}) {
  options['mimeType'] = 'application/json';
  if (angular.isDefined(fn)) {
    options['success'] = fn;
  }
  if (!options['method']) {
    options['method'] = "POST";
  }
  options['canonicalNaming'] = false;
  options['canonicalProperties'] = false;
  if (!options['error']) {
    options['error'] = function (response) {
      //alert("Jolokia request failed: " + response.error);
      var stacktrace = response.stacktrace;
      if (stacktrace) {
        var silent = options['silent'];
        if (!silent) {
          console.log(stacktrace);
          if (stacktrace.indexOf("javax.management.InstanceNotFoundException") >= 0 ||
                  stacktrace.indexOf("javax.management.AttributeNotFoundException") >= 0 ||
                  stacktrace.indexOf(" java.lang.IllegalArgumentException: No operation") >= 0) {
            // ignore these errors as they can happen on timing issues
            // such as its been removed
            // or if we run against older containers
          } else {
            notification("error", "Operation failed due to: " + stacktrace);
            console.log("Jolokia request failed: " + response.error);
          }
        }
      }
    };
  }
  return options;
}

function supportsLocalStorage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}


function isNumberTypeName(typeName):bool {
  if (typeName) {
    var text = typeName.toString().toLowerCase();
    var flag = numberTypeNames[text];
    return flag;
  }
  return false;
}

function encodeMBeanPath(mbean) {
  return mbean.replace(/\//g, '!/').replace(':', '/').escapeURL();
}

function escapeMBeanPath(mbean) {
  return mbean.replace(/\//g, '!/').replace(':', '/');
}

function encodeMBean(mbean) {
  return mbean.replace(/\//g, '!/').escapeURL();
}

function escapeDots(text:string) {
  return text.replace(/\./g, '-');
}

/**
 * Escapes all dots and 'span' text in the css style names to avoid clashing with bootstrap stuff
 */
function escapeTreeCssStyles(text:string) {
  return escapeDots(text).replace(/span/g, 'sp-an');
}

/**
 * Displays an alert message which is typically the result of some asynchronous operation
 *
 * @param type which is usually "success" or "error" and matches css alert-* css styles
 * @param message the text to display
 */
function notification (type:string, message:string) {
  var w:any = window;
  w.toastr[type](message);
}

/**
 * Clears all the pending notifications
 */
function clearNotifications() {
  var w:any = window;
  w.toastr.clear();
}

/**
 * Returns the CSS class for a log level based on if its info, warn, error etc.
 *
 * @return {string}
 */
function logLevelClass(level:string) {
  if (level) {
    var first = level[0];
    if (first === 'w' || first === "W") {
      return "warning"
    } else if (first === 'e' || first === "E") {
      return "error";
    } else if (first === 'd' || first === "d") {
      return "info";
    }
  }
  return "";
}

if (!Object.keys) {
  Object.keys = function(obj) {
    var keys = [],
        k;
    for (k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        keys.push(k);
      }
    }
    return keys;
  };
}


module Core {

  /**
   * Creates a link by appending the current $location.search() hash to the given href link,
   * removing any required parameters from the link
   *
   * @param $location
   * @param href the link to have any $location.search() hash parameters appended
   * @param removeParams any parameters to be removed from the $location.search()
   * @return the link with any $location.search() parameters added
   */
  export function createHref($location, href, removeParams = null) {
    var hashMap = angular.copy($location.search());
    // lets remove any top level nav bar related hash searches
    if (removeParams) {
      angular.forEach(removeParams, (param) =>  delete hashMap[param]);
    }
    var hash = Core.hashToString(hashMap);
    if (hash) {
      var prefix = (href.indexOf("?") >= 0) ? "&" : "?";
      href += prefix + hash;
    }
    return href;
  }

  /**
   * Trims the leading prefix from a string if its present
   */
  export function trimLeading(text:string, prefix:string) {
    if (text && prefix) {
      if (text.startsWith(prefix)) {
        return text.substring(prefix.length);
      }
    }
    return text;
  }

  /**
   * Trims the trailing postfix from a string if its present
   */
  export function trimTrailing(text:string, postfix:string) {
    if (text && postfix) {
      if (text.endsWith(postfix)) {
        return text.substring(0, text.length - postfix.length);
      }
    }
    return text;
  }

  /**
   * Turns the given search hash into a URI style query string
   */
  export function hashToString(hash) {
    var keyValuePairs:string[] = [];
    angular.forEach(hash, function (value, key) {
      keyValuePairs.push(key + "=" + value);
    });
    var params = keyValuePairs.join("&");
    return encodeURI(params);
  }

  /*
   * Register a JMX operation to poll for changes
   */
  export function register(jolokia, scope, arguments: any, callback) {
    if (!angular.isDefined(scope.$jhandle) || !angular.isArray(scope.$jhandle)) {
      scope.$jhandle = [];
    }
    if (angular.isDefined(scope.$on)) {
      scope.$on('$destroy', function (event) {
        unregister(jolokia, scope);
      });
    }
    if (angular.isArray(arguments)) {
      if (arguments.length >= 1) {
        // TODO can't get this to compile in typescript :)
        //var args = [callback].concat(arguments);
        var args = [callback];
        angular.forEach(arguments, (value) => args.push(value));
        //var args = [callback];
        //args.push(arguments);
        var registerFn = jolokia.register;
        var handle = registerFn.apply(jolokia, args);
        scope.$jhandle.push(handle);
        jolokia.request(arguments, callback);
      }
    } else {
      var handle = jolokia.register(callback, arguments);
      scope.$jhandle.push(handle);
      jolokia.request(arguments, callback);
    }
  }

    /*
     * Register a JMX operation to poll for changes using a jolokia search using the given mbean pattern
     */
    export function registerSearch(jolokia, scope, mbeanPattern:string, callback) {
        if (!angular.isDefined(scope.$jhandle) || !angular.isArray(scope.$jhandle)) {
            scope.$jhandle = [];
        }
        if (angular.isDefined(scope.$on)) {
            scope.$on('$destroy', function (event) {
                unregister(jolokia, scope);
            });
        }
        if (angular.isArray(arguments)) {
            if (arguments.length >= 1) {
                // TODO can't get this to compile in typescript :)
                //var args = [callback].concat(arguments);
                var args = [callback];
                angular.forEach(arguments, (value) => args.push(value));
                //var args = [callback];
                //args.push(arguments);
                var registerFn = jolokia.register;
                var handle = registerFn.apply(jolokia, args);
                scope.$jhandle.push(handle);
                jolokia.search(mbeanPattern, callback);
            }
        } else {
            var handle = jolokia.register(callback, arguments);
            scope.$jhandle.push(handle);
            jolokia.search(mbeanPattern, callback);
        }
    }

    export function unregister(jolokia, scope) {
    if (angular.isDefined(scope.$jhandle)) {
      scope.$jhandle.forEach(function (handle) {
        jolokia.unregister(handle);
      });
      delete scope.$jhandle;
    }
  }

  /**
   * Converts the given XML node to a string representation of the XML
   */
  export function xmlNodeToString(xmlNode) {
    try {
      // Gecko- and Webkit-based browsers (Firefox, Chrome), Opera.
      return (new XMLSerializer()).serializeToString(xmlNode);
    }
    catch (e) {
      try {
        // Internet Explorer.
        return xmlNode.xml;
      }
      catch (e) {
        //Other browsers without XML Serializer
        console.log('WARNING: XMLSerializer not supported');
      }
    }
    return false;
  }

  /**
   * Returns true if the given DOM node is a text node
   */
  export function isTextNode(node) {
    return node && node.nodeType === 3;
  }


  /**
   * Performs a $scope.$apply() if not in a digest right now otherwise it will fire a digest later
   */
  export function $applyNowOrLater($scope) {
    if ($scope.$$phase || $scope.$root.$$phase) {
      setTimeout(() => {
        Core.$apply($scope);
      }, 50);
    } else {
      $scope.$apply();
    }
  }

  /**
   * Performs a $scope.$apply() after the given timeout period
   */
  export function $applyLater($scope, timeout = 50) {
    setTimeout(() => {
      Core.$apply($scope);
    }, timeout);
  }


  /**
   * Performs a $scope.$apply() if not in a digest or apply phase on the given scope
   */
  export function $apply($scope) {
    var phase = $scope.$$phase || $scope.$root.$$phase;
    if (!phase) {
      $scope.$apply();
    }
  }

  export function $digest($scope) {
    var phase = $scope.$$phase || $scope.$root.$$phase;
    if (!phase) {
      $scope.$digest();
    }
  }

  /**
   * Returns the lowercase file extension of the given file name or returns the empty
   * string if the file does not have an extension
   */
  export function fileExtension(name: string, defaultValue: string = "") {
    var extension = defaultValue;
    if (name) {
      var idx = name.lastIndexOf(".");
      if (idx > 0) {
        extension = name.substring(idx + 1, name.length).toLowerCase();
      }
    }
    return extension;
  }

  export function parseIntValue(value, description: string) {
    if (angular.isString(value)) {
      try {
        return parseInt(value);
      } catch (e) {
        console.log("Failed to parse " + description + " with text '" + value + "'");
      }
    }
    return null;
  }

  export function parseFloatValue(value, description: string) {
    if (angular.isString(value)) {
      try {
        return parseFloat(value);
      } catch (e) {
        console.log("Failed to parse " + description + " with text '" + value + "'");
      }
    }
    return null;
  }

  /**
   * Look up a list of child element names or lazily create them.
   *
   * Useful for example to get the <tbody> <tr> element from a <table> lazily creating one
   * if not present.
   *
   * Usage: var trElement = getOrCreateElements(tableElement, ["tbody", "tr"])
   */
  export function getOrCreateElements(domElement, arrayOfElementNames:string[]) {
    var element = domElement;
    angular.forEach(arrayOfElementNames, name => {
      if (element) {
        var children = $(element).children(name);
        if (!children || !children.length) {
          $("<" + name + "></" + name + ">").appendTo(element);
          children = $(element).children(name);
        }
        element = children;
      }
    });
    return element;
  }

  export function getUUID() {
    var d = new Date();
    var ms = (d.getTime() * 1000) + d.getUTCMilliseconds();
    var random = Math.floor((1 + Math.random()) * 0x10000);
    return ms.toString(16) + random.toString(16);
  }

  /**
   * Navigates the given set of paths in turn on the source object
   * and returns the last most value of the path or null if it could not be found.
   *
   * @param object the start object to start navigating from
   * @param paths an array of path names to navigate or a string of dot separated paths to navigate
   * @param newValue the value to update
   * @return {*} the last step on the path which is updated
   */
  export function pathGet(object, paths) {
    var pathArray = (angular.isArray(paths)) ? paths : (paths || "").split(".");
    var value = object;
    angular.forEach(pathArray, (name) => {
      if (value) {
        try {
          value = value[name];
        } catch (e) {
          // ignore errors
          return null;
        }
      } else {
        return null;
      }
    });
    return value;
  }

  /**
   * Navigates the given set of paths in turn on the source object
   * and updates the last path value to the given newValue
   *
   * @param object the start object to start navigating from
   * @param paths an array of path names to navigate or a string of dot separated paths to navigate
   * @param newValue the value to update
   * @return {*} the last step on the path which is updated
   */
  export function pathSet(object, paths, newValue) {
    var pathArray = (angular.isArray(paths)) ? paths : (paths || "").split(".");
    var value = object;
    var lastIndex = pathArray.length - 1;
    angular.forEach(pathArray, (name, idx) => {
      var next = value[name];
      if (!angular.isObject(next)) {
        next = (idx < lastIndex) ? {} : newValue;
        value[name] = next;
      }
      value = next;
    });
    return value;
  }

  var _escapeHtmlChars = {
    "#": "&#35;",
    "'": "&#39;",
    "<": "&lt;",
    "\"": "&quot;"
  };

  export function unescapeHtml(str) {
    angular.forEach(_escapeHtmlChars, (value, key) => {
      var regex = new RegExp(value, "g");
      str = str.replace(regex, key);
    });
    str = str.replace(/&gt;/g, ">");
    return str;
  }

  export function escapeHtml(str) {
    if (angular.isString(str)) {
      var newStr = "";
      for (var i = 0; i < str.length; i++) {
        var ch = str.charAt(i);
        var ch = _escapeHtmlChars[ch] || ch;
        newStr += ch;
/*
        var nextCode = str.charCodeAt(i);
        if (nextCode > 0 && nextCode < 48) {
          newStr += "&#" + nextCode + ";";
        }
        else {
          newStr += ch;
        }
*/
      }
      return newStr;
    }
    else {
      return str;
    }
  }

  var _versionRegex = /[^\d]*(\d+)\.(\d+)(\.(\d+))?.*/

  /**
   * Parses some text of the form "xxxx2.3.4xxxx"
   * to extract the version numbers as an array of numbers then returns an array of 2 or 3 numbers.
   *
   * Characters before the first digit are ignored as are characters after the last digit.
   *
   * @param text a maven like string containing a dash then numbers separated by dots
   */
  export function parseVersionNumbers(text: string) {
    if (text) {
      var m = text.match(_versionRegex);
      if (m && m.length > 4) {
        var m1 = m[1];
        var m2 = m[2];
        var m4 = m[4];
        if (angular.isDefined(m4)) {
          return [parseInt(m1), parseInt(m2), parseInt(m4)];
        } else if (angular.isDefined(m2)) {
          return [parseInt(m1), parseInt(m2)];
        } else if (angular.isDefined(m1)) {
          return [parseInt(m1)];
        }
      }
    }
    return null;
  }

  /**
   * Compares the 2 version arrays and returns -1 if v1 is less than v2 or 0 if they are equal or 1 if v1 is greater than v2
   *
   * @param v1 an array of version numbers with the most significant version first (major, minor, patch).
   * @param v2
   */
  export function compareVersionNumberArrays(v1:number[], v2:number[]) {
    if (v1 && !v2) {
      return 1;
    }
    if (!v1 && v2) {
      return -1;
    }
    if (v1 === v2) {
      return 0;
    }
    for (var i = 0; i < v1.length; i++) {
      var n1 = v1[i];
      if (i >= v2.length) {
        return 1;
      }
      var n2 = v2[i];
      if (!angular.isDefined(n1)) {
        return -1;
      }
      if (!angular.isDefined(n2)) {
        return 1;
      }
      if (n1 > n2) {
        return 1;
      } else if (n1 < n2) {
        return -1;
      }
    }
    return 0;
  }

  /**
   * If the value is not an array then wrap it in one
   */
  export function asArray(value) {
    return angular.isArray(value) ? value : [value];
  }

  /**
   * Helper function which converts objects into tables of key/value properties and
   * lists into a <ul> for each value.
   */
  export function valueToHtml(value) {
    if (angular.isArray(value)) {
      var size = value.length;
      if (!size) {
        return "";
      } else if (size === 1) {
        return valueToHtml(value[0]);
      } else {
        var buffer = "<ul>";
        angular.forEach(value, (childValue) => {
          buffer += "<li>" + valueToHtml(childValue) + "</li>"
        });
        return buffer + "</ul>"
      }
    } else if (angular.isObject(value)) {
      var buffer = "<table>";
      angular.forEach(value, (childValue, key) => {
        buffer += "<tr><td>" + key + "</td><td>" + valueToHtml(childValue) + "</td></tr>"
      });
      return buffer + "</table>"
    } else if (angular.isString(value)) {
      var uriPrefixes = ["http://", "https://", "file://", "mailto:"];
      var answer = value;
      angular.forEach(uriPrefixes, (prefix) => {
        if (answer.startsWith(prefix)) {
          answer = "<a href='" + value + "'>" + value + "</a>";
        }
      });
      return answer;
    }
    return value;
  }

  /**
   * If the string starts and ends with [] {} then try parse as JSON and return the parsed content or return null
   * if it does not appear to be JSON
   */
  export function tryParseJson(text: string) {
    text = text.trim();
    if ((text.startsWith("[") && text.endsWith("]")) || (text.startsWith("{") && text.endsWith("}"))) {
      try {
        return JSON.parse(text);
      } catch (e) {
        // ignore
      }
    }
    return null;
  }

  /**
   * Given values (n, "person") will return either "1 person" or "2 people" depending on if a plural
   * is required using the String.pluralize() function from sugarjs
   */
  export function maybePlural(count: Number, word: string) {
    var pluralWord = (count === 1) ? word : word.pluralize();
    return "" + count + " " + pluralWord;
  }

  /**
   * given a JMX ObjectName of the form <code>domain:key=value,another=something</code> then return the object
   * <code>{key: "value", another: "something"}</code>
   * @param name
   */
  export function objectNameProperties(objectName: string) {
    var entries = {};
    if (objectName) {
      var idx = objectName.indexOf(":");
      if (idx > 0) {
        var path = objectName.substring(idx + 1);
        var items = path.split(',');
        angular.forEach(items, (item) => {
          var kv = item.split('=');
          var key = kv[0];
          var value = kv[1] || key;
          entries[key] = value;
        });
      }
    }
    return entries;
  }

  export function setPageTitle($document, title) {
    document.title = title.join(' : ');
  }

  /**
   * Returns the Folder object for the given domain name and type name or null if it can not be found
   */
  export function getMBeanTypeFolder(workspace:Workspace, domain: string, typeName: string):Folder {
    if (workspace) {
      var mbeanTypesToDomain = workspace.mbeanTypesToDomain || {};
      var types = mbeanTypesToDomain[typeName] || {};
      var answer = types[domain];
      if (angular.isArray(answer) && answer.length) {
        return answer[0];
      }
      return answer;
    }
    return null;
  }

  /**
   * Returns the JMX objectName for the given jmx domain and type name
   */
  export function getMBeanTypeObjectName(workspace:Workspace, domain: string, typeName: string):string {
    var folder = Core.getMBeanTypeFolder(workspace, domain, typeName);
    return Core.pathGet(folder, ["objectName"]);
  }

  /**
   * Removes dodgy characters from a value such as '/' or '.' so that it can be used as a DOM ID value
   * and used in jQuery / CSS selectors
   */
  export function toSafeDomID(text: string) {
    return text ? text.replace(/(\/|\.)/g, "_") : text;
  }

}
