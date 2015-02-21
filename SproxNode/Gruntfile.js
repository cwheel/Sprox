module.exports = function(grunt) {
  grunt.initConfig({
    sass: {                              
      dist: {                            
        options: {                       
          style: 'expanded'
        },
        files: {                         
          'app/style/login.css': 'app/style/login.scss',
          'app/style/main.css': 'app/style/main.scss', 
          'app/style/map.css': 'app/style/map.scss',  
          'app/style/studentCenter.css': 'app/style/studentCenter.scss',  
        }
      }
    },
    nodemon: {
      dev: {
        script: 'server.js'
      }
    },
    shell: {
      mongodb: {
        command: "mongod --dbpath=db",
        options: {
          async: true,
          stdout: false,
          stderr: true,
          failOnError: false,
          execOptions: {
            cwd: "."
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-shell-spawn');
  grunt.loadNpmTasks('grunt-nodemon');

  grunt.registerTask('default', ['sass', 'shell:mongodb', 'nodemon']);
};