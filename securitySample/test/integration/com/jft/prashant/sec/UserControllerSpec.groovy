package com.jft.prashant.sec

import grails.test.spock.IntegrationSpec

/**
 * Created by prashant on 26/6/14.
 */
class UserControllerSpec extends IntegrationSpec{

    UserController controller
    Map renderedMap

    public void setup() {
        controller = new UserController()

        UserController.metaClass.render = { Map map ->
            renderedMap = map
        }
    }

    public void cleanup() {

    }

    void "test list"(){
        when:
        controller.list()

        then:
        renderedMap
        renderedMap.template
        renderedMap.template.equals('list')
        renderedMap.model
        renderedMap.model.userInstanceList.size() > 0
    }

    void "test index"(){
        when:
        controller.index()

        then:
        renderedMap
        renderedMap.view
        renderedMap.view.equals('index')
        renderedMap.model
        renderedMap.model.userInstanceList.size() > 0
    }
}
