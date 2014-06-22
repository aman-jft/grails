import com.jft.prashant.sec.Role
import com.jft.prashant.sec.User
import com.jft.prashant.sec.UserRole
import grails.util.Holders

class BootStrap {

    def init = { servletContext ->
        [Holders.config.com.jft.prashant.sec.role.admin, Holders.config.com.jft.prashant.sec.role.user].each {
            new Role(authority: it).save(flush: true, failOnError: true)
        }

        User user = new User(username: 'pgupta', email: 'pgupta@jellyfishtechnologies.com',
                firstName: 'Prashant', lastName: 'Gupta', password: 'password')
        user.save(flush: true, failOnError: true)

        new UserRole(role: Role.findByAuthority(Holders.config.com.jft.prashant.sec.role.admin),
                user: user).save(flush: true, failOnError: true)

        user = new User(username: 'user', email: 'user@jellyfishtechnologies.com',
                firstName: 'User', lastName: '1', password: 'password')
        user.save(flush: true, failOnError: true)

        new UserRole(role: Role.findByAuthority(Holders.config.com.jft.prashant.sec.role.user),
                user: user).save(flush: true, failOnError: true)
    }
    def destroy = {
    }
}
