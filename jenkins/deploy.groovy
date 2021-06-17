pipeline {
    agent any
    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '2'))
    }

    stages {
        stage('Deploy to DEWEAP03') {
            environment {
                SSH_CONNECTION = 'jenkins@212.184.115.17'
                DEPLOYMENT_PATH = '/usr/share/nginx/html/firstspirit-snap-extension/'
            }
            steps {
                // PUBLISH TO LIVE SERVER
                sh "scp -i '~jenkins/.ssh/id_rsa' *.js ${SSH_CONNECTION}:${DEPLOYMENT_PATH}"
            }
        }
    }
}
