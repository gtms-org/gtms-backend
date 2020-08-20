def branch = '';

pipeline {
    agent any

    environment {
        CI = 'true'
        GIT_SSH_COMMAND = "ssh -o StrictHostKeyChecking=no"
        GH_TOKEN = credentials('jenkins-github-accesstoken')
    }

    stages {
        stage ('prepare') {
            steps {
                script {
                    sh "printenv"
                }
            }
        }

        stage ('Checkout') {
            steps {
                    checkout([
                            $class                           : 'GitSCM',
                            branches                         : [[name: "${branch}"]],
                            browser                          : [$class: 'GithubWeb', repoUrl: "https://github.com/mariusz-kabala/gtms-backend"],
                            doGenerateSubmoduleConfigurations: false,
                            userRemoteConfigs                : [[
                                credentialsId: 'github',
                                refspec      : '+refs/pull/*:refs/remotes/origin/pr/*',
                                url          : "git@github.com:mariusz-kabala/gtms-backend.git"
                            ]]
                    ])
            }
        }

        stage ('Deploy worker') {
            when {
                expression {
                    env.SERVICE_NAME == 'worker-auth' ||
                    env.SERVICE_NAME == 'worker-es-indexer' ||
                    env.SERVICE_NAME == 'worker-files' ||
                    env.SERVICE_NAME == 'worker-groups' ||
                    env.SERVICE_NAME == 'worker-tags' ||
                    env.SERVICE_NAME == 'worker-posts' ||
                    env.SERVICE_NAME == 'worker-notifications'
                }
            }
            steps {
                script {
                    build job: '(GTMS Backend) Deploy worker', wait: false, parameters: [
                        string(name: 'ghprbActualCommit', value: "${ghprbActualCommit}"),
                        string(name: 'version', value: env.VERSION),
                        string(name: 'SERVICE_NAME', value: env.SERVICE_NAME),
                        string(name: 'DEPLOY_ENVIRONMENT', value: env.DEPLOY_ENVIRONMENT)
                    ]
                }
            }
        }

        stage ('Deploy service') {
            when {
                expression {
                    env.SERVICE_NAME == 'service-auth' ||
                    env.SERVICE_NAME == 'service-groups' ||
                    env.SERVICE_NAME == 'service-files' ||
                    env.SERVICE_NAME == 'service-tags' ||
                    env.SERVICE_NAME == 'service-posts' ||
                    env.SERVICE_NAME == 'service-comments' ||
                    env.SERVICE_NAME == 'service-notifications'
                }
            }
            steps {
                script {
                    build job: '(GTMS Backend) Deploy service', wait: false, parameters: [
                        string(name: 'ghprbActualCommit', value: "${ghprbActualCommit}"),
                        string(name: 'version', value: env.VERSION),
                        string(name: 'SERVICE_NAME', value: env.SERVICE_NAME),
                        string(name: 'DEPLOY_ENVIRONMENT', value: env.DEPLOY_ENVIRONMENT)
                    ]
                }
            }
        }

        stage ('Deploy public gatekeeper') {
            when {
                environment name: 'SERVICE_NAME', value: 'gatekeeper-public'
            }
            steps {
                script {
                    build job: '(GTMS Backend) Deploy gatekeeper', wait: false, parameters: [
                        string(name: 'ghprbActualCommit', value: "${ghprbActualCommit}"),
                        string(name: 'version', value: env.VERSION),
                        string(name: 'DEPLOY_ENVIRONMENT', value: env.DEPLOY_ENVIRONMENT)
                    ]
                }
            }
        }

        stage ('Deploy iframely') {
            when {
                environment name: 'SERVICE_NAME', value: 'service-iframely'
            }
            steps {
                script {
                    build job: '(GTMS Backend) Deploy iframely', wait: false, parameters: [
                        string(name: 'ghprbActualCommit', value: "${ghprbActualCommit}"),
                        string(name: 'version', value: env.VERSION),
                        string(name: 'DEPLOY_ENVIRONMENT', value: env.DEPLOY_ENVIRONMENT)
                    ]
                }
            }
        }

        stage ('Deploy swagger') {
            when {
                environment name: 'SERVICE_NAME', value: 'swagger'
            }
            steps {
                script {
                    build job: '(GTMS Backend) Deploy swagger', wait: false, parameters: [
                        string(name: 'ghprbActualCommit', value: "${ghprbActualCommit}"),
                        string(name: 'version', value: env.VERSION),
                        string(name: 'DEPLOY_ENVIRONMENT', value: env.DEPLOY_ENVIRONMENT)
                    ]
                }
            }
        }
    }
}
