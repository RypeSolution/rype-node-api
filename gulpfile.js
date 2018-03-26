"use strict";
const gulp = require('gulp')
const _ = require('lodash')
const bz = require('bkendz')

gulp.task('sync:models:clean', () => bz.modelsSync({clean: true, seed: false}))
gulp.task('sync:models:seed', () => bz.modelsSync({clean: true, seed: true}))

gulp.task('db:migrate', bz.db.generateMigrations)
gulp.task('db:seed', () => {
    bz.db.init(true)
})