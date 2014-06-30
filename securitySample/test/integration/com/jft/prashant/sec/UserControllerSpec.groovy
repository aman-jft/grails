package com.jft.prashant.sec

import grails.test.spock.IntegrationSpec
import spock.lang.Unroll

/**
 * Created by prashant on 26/6/14.
 */
class UserControllerSpec extends IntegrationSpec {

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

    void "test list"() {
        when:
        controller.list()

        then:
        renderedMap
        renderedMap.template
        renderedMap.template.equals('list')
        renderedMap.model
        renderedMap.model.userInstanceList.size() > 0
    }

    void "test index"() {
        when:
        controller.index()

        then:
        renderedMap
        renderedMap.view
        renderedMap.view.equals('index')
        renderedMap.model
        renderedMap.model.userInstanceList.size() > 0
    }

    @Unroll
    void "test create for username: #username"() {
        when:
        controller.params['username'] = username
        controller.params['firstName'] = firstName
        controller.params['lastName'] = lastName
        controller.params['password'] = password
        controller.params['email'] = email

        controller.save()

        then:
        User.list().last().username == username

        where:
        username  | firstName | lastName | password | email
        'apandey' | 'Amit'    | 'Pandey' | 'p'      | 'pgupta@jellyfishtechnologies.com'
        'neeraj'  | 'Neeraj'  | 'Bhatt'  | 'p'      | 'neeraj@jellyfishtechnologies.com'
        'vivek'   | 'Vivek'   | 'Yadav'  | 'p'      | 'vivek@jellyfishtechnologies.com'
        'manish'  | 'Manish'  | 'Bharti' | 'p'      | 'manish@jellyfishtechnologies.com'
        'vsadh'   | 'Vivek'   | 'Sadh'   | 'p'      | 'vsadh@jellyfishtechnologies.com'
    }
}
