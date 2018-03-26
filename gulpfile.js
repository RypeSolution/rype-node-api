"use strict";
const gulp = require('gulp')
const _ = require('lodash')
const bz = require('bkendz')
const path = require('path')

const sequelizeBinPath = path.resolve(__dirname, './node_modules/.bin/sequelize')

gulp.task('sync:models:clean', () => bz.modelsSync({clean: true, seed: false, sequelizeBinPath}))
gulp.task('sync:models:seed', () => bz.modelsSync({clean: true, seed: true, sequelizeBinPath}))

gulp.task('db:migrate', bz.db.generateMigrations)
gulp.task('db:seed', () => {
    bz.db.init(true)
})