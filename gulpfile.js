"use strict";
const gulp = require('gulp')
const _ = require('lodash')
const bz = require('bkendz')
const path = require('path')

const sequelizeBinPath = path.resolve(__dirname, './node_modules/.bin/sequelize')

gulp.task('sync:models:clean', () => bz.modelsSync({clean: true, seed: false, sequelizeBinPath}))
gulp.task('sync:models:seed', function (){
    return bz.modelsSync({clean: true, seed: true, sequelizeBinPath})
        .then(() => console.log('[sync:models:seed] complete!'))
})

gulp.task('db:migrate', bz.db.generateMigrations)
gulp.task('db:seed', () => {
    bz.db.init(true)
})