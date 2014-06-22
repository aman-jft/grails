import grails.plugin.springsecurity.SecurityConfigType


com.jft.prashant.sec.role.admin = 'ADMIN'
com.jft.prashant.sec.role.user = 'USER'

grails.plugin.springsecurity.securityConfigType = SecurityConfigType.InterceptUrlMap

grails.plugin.springsecurity.interceptUrlMap = [
        '/static/**': ['IS_AUTHENTICATED_ANONYMOUSLY'],
        '/plugins/**': ['IS_AUTHENTICATED_ANONYMOUSLY'],
        '/js/**': ['IS_AUTHENTICATED_ANONYMOUSLY'],
        '/css/**': ['IS_AUTHENTICATED_ANONYMOUSLY'],
        '/skin/**': ['IS_AUTHENTICATED_ANONYMOUSLY'],
        '/images/**': ['IS_AUTHENTICATED_ANONYMOUSLY'],
        '/login/**': ['IS_AUTHENTICATED_ANONYMOUSLY'],
        '/logout/**': ['IS_AUTHENTICATED_ANONYMOUSLY'],
        '/j_spring_security_check': ['IS_AUTHENTICATED_ANONYMOUSLY'],

        '/user/**': ["hasAnyRole('${com.jft.prashant.sec.role.admin}')"],
        '/role/**': ["hasAnyRole('${com.jft.prashant.sec.role.admin}')"],
        '/userRole/**': ["hasAnyRole('${com.jft.prashant.sec.role.admin}')"],
        '/*': ['IS_AUTHENTICATED_FULLY']
]