/**
 * Created by anthony on 26/03/2018.
 */
const _ = require('lodash')
const bz = require('bkendz')
const path = require('path')

const app = new bz.Bkendz({
    administerEnabled: false,
    clientEnabled: false,
    apiEnabled: true,
    optsAdmin: {staticPath: path.join(__dirname, './src')}
})

app.api.on('request', (messageHandler, request, conn) => {
    messageHandler.respond(conn, request)
})

const wsHandler = app.api.messageHandlers.ws
const router = app.api.messageHandlers.http
const models = app.api.models

wsHandler.topic('/status', () => {
    return {data: {clients: app.api.connections.length}}
})

app.apiHttp.app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With")
    res.header("Access-Control-Request-Method", "GET,POST,PUT,DELETE,OPTIONS")
    next()
})

wsHandler.on('subscription_added', subject => {
    console.log('sending snapshot')
    models.User.all().then((users) => {
        let updates = users.map(u => {
            return {changeType: 'NEW', type: models.User.name, value: u.get({plain: true})}
        })
        wsHandler.emit('db_update', updates)
    })
    
    models.RentalItem.all().then((items) => {
        let updates = items.map(u => {
            return {changeType: 'NEW', type: models.RentalItem.name, value: u.get({plain: true})}
        })
        wsHandler.emit('db_update', updates)
    })
})

wsHandler.on('db_update', (updates) => {
    for(let subscriberConn of wsHandler.subscribers['db_update'] || []){
        subscriberConn.send('/subscribe?subject=db_update', {type: 'utf8', data:{updates}})
    }
})

wsHandler.topic('/status', (conn, msg) => {
    return {data: 'hello world'}
})

wsHandler.topic('/search', (conn, msg) => {
    console.log('MSG', msg)
    const models = require('./models')
    let query = msg.q
    let queryLower = query.toLowerCase()
    
    const filter = (modelJson) => {
        for(let val of Object.values(modelJson)){
            if(_.isString(val) && val.toLowerCase().indexOf(queryLower) !== -1){
                return true
            }
        }
        return false
    }
    
    const toJsonList = (modelName, models) => {
        return models.map((m) => {
            let j = m.get({plain:true})
            j.$type = modelName
            return j
        })
    }
    
    return Promise.all([models.RentalItem.all(), models.User.all()])
        .then(([items, users]) => {
            let filteredItems = _.filter(toJsonList(models.RentalItem.name, items), filter)
            let filteredUsers = _.filter(toJsonList(models.User.name, users), filter)
            
            return {data: {results: _.concat(filteredItems, filteredUsers)}}
        })
})

wsHandler.topic('/subscribe', (conn, msg) => {
    
    wsHandler.addSubscription(msg.subject, conn)
    
    return {data: {subscribed: msg.subject || null}}
})


function createUser(req, res) {
    console.log('request body:', req.body)
    let name = `${req.body.firstName} ${req.body.lastName}`
    
    let userData = {
        name: name,
        password: req.body.password,
        email: req.body.email
    }
    
    console.log('creating user:', userData)
    models.User.create(userData)
        .then(user => {
            let userJson = user.get({
                plain: true
            })
            res.json(userJson)
            
            wsHandler.emit('db_update', [{changeType: 'NEW', type: models.User.name, value: userJson}])
        })
        .catch(error => {
            res.json({error})
        })
}

function authenticate(req, res) {
    let email = req.body.email;
    let password = req.body.password;
    console.log('authenticating: email=%s', email);
    if (email && password) {
        return models.User.findOne({where: {email: email}}).then(function (user) {
            let ret = null;
            if (user) {
                let authenticated = user.authenticate(password);
                ret = authenticated && user || null;
                console.log('authenticated %j: %s', user.toJSON(), authenticated);
            }
            return ret;
        })
            .then(function (user) {
                return _.isObject(user) ? res.json(user) : res.send(401);
            })
    } else {
        return res.send(401);
    }
}

router.post('/api/sessions', function (req, res, next) {
    let email = req.body.email;
    let password = req.body.password;
    
    if (email && password) {
        return models.User.findOne({where: {email: email}})
            .then(function (user) {
                if (user && user.authenticate(password)) {
                    console.log('authenticated %s: %j', email, user.toJSON());
                    let token = jwt.encode({email: email}, 'SECRET');
                    return res.send(token)
                } else {
                    return res.sendStatus(401)
                }
            }).catch((err) => {
                return next(err)
            })
    } else {
        return res.sendStatus(401);
    }
})

router.post('/authenticate', authenticate)
router.post('/api/users', createUser)
router.post('/signup', createUser)

router.options('/signup', function (req, res) {
    res.json({hello: 'world'})
})

router.options('/authenticate', function (req, res) {
    res.json({hello: 'world'})
})

const port = process.env.PORT || 9000
console.log(`starting API server on ${port}...`)
app.listen(port)