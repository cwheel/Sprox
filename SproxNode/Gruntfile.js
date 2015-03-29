module.exports = function(grunt) {
  grunt.initConfig({
    sass: {                              
      dist: {                            
        options: {                       
          style: 'expanded'
        },
        files: [                        
          {
            expand: true,
            cwd: "app/scss",
            src: ["**/*.scss"],
            dest: "app/style",
            ext: ".css"
          }
        ]
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
    },
    watch: {
      sass: {
          files: ['app/scss/*.scss'],
          tasks: ['sass'],
          options: {
              spawn: false
          }
        } 
    }
  });

  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-shell-spawn');
  grunt.loadNpmTasks('grunt-nodemon');  

  grunt.registerTask('default', ['sass', 'shell:mongodb', 'nodemon']);
};