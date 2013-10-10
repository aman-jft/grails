<%--
  Created by IntelliJ IDEA.
  User: prashant
  Date: 10/10/13
  Time: 4:40 PM
  To change this template use File | Settings | File Templates.
--%>

<%@ page contentType="text/html;charset=UTF-8" %>
<html ng-app="myApp">
<head>
  <title>Simple</title>
</head>
<body>
<div ng-controller="Contacts" id="defaultDiv" data-template-base-url="${createLink(uri: '/ng-templates/routes')}">
    <h1>Contacts</h1>
    <div ng-view></div>
</div>
<g:javascript src="jquery-1.10.2.min.js"/>
<g:javascript src="angular.js"/>
<g:javascript src="contacts.js"/>
</body>
</html>