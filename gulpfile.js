/**
 * Created by 黄玄 on 15/06/02.
 * Updated by Hux on 15/06/10.
 *
 * Gulpfile 用于新版 requireJS 方案打包
 */

var gulp = require('gulp');
var path = require('path');
var childProcess = require('child_process');
var exec = childProcess.exec;

// node serve
gulp.task('serve', function() {
    exec(['sudo node server.js'].join(' '), function(error, stdout, stderr) {
        console.log(stdout);
    });
});


// compile sass
var sass = require('gulp-sass');
gulp.task('sass', function() {
    return gulp.src('./src/css/style.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('./src/css/'))
});

// prefix by PostCSS
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer-core');

gulp.task('css', ['sass'], function () {
    return gulp.src('./src/css/style.css')
        .pipe(postcss([ autoprefixer({ browsers: ['last 2 version'] }) ]))
        .pipe(gulp.dest('./src/css/')); // 修改源文件
});



// build
gulp.task('build', ['css'], function() {
    var build = 'node r.js -o build.js';

    exec(build, function callback(error, stdout, stderr){
        //console.log(stdout);
        console.log('finish build');
    });
});


// server
gulp.task('serve', function(){
    exec('supervisor server.js', function(error, stdout, stderr){
        console.log("server running at port: 9000");
    })
})

// watch
gulp.task('watch', ['css', 'serve'], function(){
    // watch SASS
    gulp.watch('src/css/*.scss', ['css']);
})

// default
gulp.task('default', ['watch']);
