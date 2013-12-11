

module.exports = function (grunt) {
    grunt.initConfig({
        useminPrepare: {
            options: {
                dest: './'
            },
            html: 'index.src.html'
        },
        usemin: {
            html: 'index.html',
            options: {
              assetsDirs: ['dist', 'dist']
            }
        },
        copy: {
          main: {
            src: 'index.src.html',
            dest: 'index.html'
          }
        }
    });

    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('build', [
        'useminPrepare'
      , 'concat'
      , 'uglify'
      , 'cssmin'
      , 'copy'
      , 'usemin'
    ]);

    grunt.registerTask('default', [
      'build'
    ]);
};
