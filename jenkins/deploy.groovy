def branch = '';

pipeline {
    agent { 
        docker { 
            image 'docker-registry.kabala.tech/alpine-terraform:latest' 
            args '-v /var/run/docker.sock:/var/run/docker.sock:rw,z'
        } 
    }

    environment {
        CI = 'true'
        GIT_SSH_COMMAND = "ssh -o StrictHostKeyChecking=no"
        GH_TOKEN = credentials('jenkins-github-accesstoken')
        DOCKER_REGISTRY_USERNAME = credentials('docker-registry-username')
        DOCKER_REGISTRY_PASSWORD = credentials('docker-registry-password')
        AWS_ACCESS_KEY_ID = credentials('SCALEWAY_S3_ACCESS_KEY')
        AWS_SECRET_ACCESS_KEY = credentials('SCALEWAY_S3_ACCESS_SECRET_KEY')
        SENDGRID_API_KEY = credentials('sendgrid-gtms-qa')
    }

    stages {
        stage ('Set qa-master vars') {
            when {
                environment name: 'DEPLOY_ENVIRONMENT', value: 'qa-master'
            }
            steps {
                script {
                    env.JWT_SECRET = credentials('gtms-service-auth-qa-master-jwt-secrect')
                    env.JWT_REFRESH_TOKEN_SECRET = credentials('gtms-service-auth-qa-master-jwt-refresh-token-secrect')
                }
            }
        }
        stage ('Set qa-stable vars') {
            when {
                environment name: 'DEPLOY_ENVIRONMENT', value: 'qa-stable'
            }
            steps {
                script {
                    env.JWT_SECRET = credentials('gtms-service-auth-qa-stable-jwt-secrect')
                    env.JWT_REFRESH_TOKEN_SECRET = credentials('gtms-service-auth-qa-stable-jwt-refresh-token-secrect')
                }
            }
        }
        stage ('prepare') {
            steps {
                script {
                    try {
                        branch = env.GIT_LOCAL_BRANCH
                        branch = branch ?: env.GIT_BRANCH
                        if (branch == 'detached') {
                            branch = ''
                        }
                        branch = branch ?: env.ghprbActualCommit
                    } catch (e) {
                        println "GIT BRANCH not detected"
                    }

                    sh 'git config user.name "jenkins-kabala.tech"'
                    sh 'git config user.email "jenkins@kabala.tech"'

                    if (!branch) {
                        error "GIT branch to process not found"
                    }

                    if (branch.startsWith('origin/')) {
                        branch = branch.replaceAll('origin/', '')
                    }

                    println "GIT branch to process: ${branch}"
                    manager.addShortText(branch, "white", "navy", "1px", "navy")
                    
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
                dir("packages/${env.SERVICE_NAME}/terraform") {
                    script {
                        docker.withRegistry('https://docker-registry.kabala.tech', 'docker-registry-credentials') {
                            sh "terraform init"
                            sh "terraform workspace select ${env.DEPLOY_ENVIRONMENT} || terraform workspace new ${env.DEPLOY_ENVIRONMENT}"
                            sh "terraform plan -out deploy.plan -var-file=${env.DEPLOY_ENVIRONMENT}.tfvars -var=\"tag=${version}\" -var=\"jwt_secret=${JWT_SECRET}\" -var=\"DOCKER_REGISTRY_USERNAME=${DOCKER_REGISTRY_USERNAME}\" -var=\"DOCKER_REGISTRY_PASSWORD=${DOCKER_REGISTRY_PASSWORD}\"" 
                            sh "terraform apply -auto-approve deploy.plan"
                        }
                    }
                }
            }
            post {
                success {
                    rocketSend channel: "deployments-${env.DEPLOY_ENVIRONMENT}", message: "[${BUILD_DISPLAY_NAME}] :sunny: *${env.SERVICE_NAME}* version: *${version}* Build succeeded - ${env.JOB_NAME} ${env.BUILD_NUMBER}  (<${env.BUILD_URL}|Open>)", rawMessage: true
                }
                unsuccessful {
                    rocketSend channel: "deployments-${env.DEPLOY_ENVIRONMENT}", message: "[${BUILD_DISPLAY_NAME}] :sob: *${env.SERVICE_NAME}* version: *${version}* Build failed - ${env.JOB_NAME} ${env.BUILD_NUMBER}  (<${env.BUILD_URL}|Open>)", rawMessage: true
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
