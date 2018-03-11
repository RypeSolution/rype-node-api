'use strict';

const moment = require('moment')
const _ = require('lodash')

const users = [
    {
        name: 'Obialo Chidiebere',
        birthDate: moment('2013-06-16').toDate(),
        email: 'obialo@edey.ng',
        password_hash: '$2a$10$kqU6UluWxXMa5ualTCMoPe8eV5Q3PY/yba8N7v0hLrqxV85asCrze'
    },
    {
        name: 'Mike Jackson',
        birthDate: moment('1995-12-25').toDate(),
        email: 'jackson@edey.ng',
        password_hash: '$2a$10$kqU6UluWxXMa5ualTCMoPe8eV5Q3PY/yba8N7v0hLrqxV85asCrze'
    },
]

module.exports = {
    up: function (queryInterface, Sequelize) {
        let prods = _(users)
            .map((value) => _.extend(value, {createdAt: new Date(), updatedAt: new Date()}))
            .value()
        
        return queryInterface.bulkInsert('Users', prods, {})
    },
    down: function (queryInterface, Sequelize) {
        return queryInterface.bulkDelete('Users', null, {})
    }
};
