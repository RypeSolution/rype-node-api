/**
 * Created by anthony on 01/09/2017.
 */
const _ = require('lodash')
const url = require('url')
const EventEmitter = require('events').EventEmitter
const Promise = require('bluebird')

class WebSocketHandler extends EventEmitter {
    
    constructor() {
        super()
        this.subscribers = {}
    }
    
    onMessage(connection, message) {
        let msg = message.msg
    
        console.log('Received Message: ', msg)
        
        let parsed = url.parse(msg.topic, true)
        let handler = this.handlers[parsed.pathname]
        
        if(!handler) return {data: 404, type: 'utf8'}
    
        let resp = handler(connection, _.extend({$msg: msg}, parsed.query))
        
        
        
        return (Promise.is(resp) ? resp : Promise.resolve(resp))
            .then((value) => {
                
                if(_.isString(value)){
                    value = {type:'utf8', data:value}
                }else if(!('type' in value)){
                    value['type'] = 'utf8'
                }
                return value
            })
    }
    
    topic(label, callback) {
       this.handlers[label] = callback
    }
    
    onClose(connection, reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.')
        for(let [sub, conns] of _.toPairs(this.subscribers)){
            console.log('[onClose]', sub, ':', _.includes(conns, connection))
            _.remove(conns, connection)
        }
    }
    
    addSubscription(subject, conn){
        let subs = this.subscribers[subject] = this.subscribers[subject] || []
        subs.push(conn)
        console.log('[addSubscription] ', subject)
        wsHandler.emit('subscription_added', subject, conn)
    }
    
    get handlers() {
        return this.constructor.HANDLERS
    }
}

WebSocketHandler.HANDLERS = {}

const wsHandler = new WebSocketHandler()

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

module.exports = {wsHandler}