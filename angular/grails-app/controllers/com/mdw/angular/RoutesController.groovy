package com.mdw.angular

import grails.converters.JSON

class RoutesController {

    def index = {

    }

    def query = {
        println "================================= query ============== "
        Map jsonResponse = [:]

        jsonResponse.username='Prashant'

        render jsonResponse as JSON
    }
}
