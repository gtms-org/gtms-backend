def branch = '';
def changedJSON = '';

pipeline {
    agent any

    environment {
        app = ''
        CI = 'true'
        GIT_SSH_COMMAND = "ssh -o StrictHostKeyChecking=no"
        GH_TOKEN = credentials('jenkins-github-accesstoken')
    }

    stages {
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
                    manager.addShortText("${env.serviceName}", "white", "green", "1px", "navy")
                    
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
        stage ('Build Containers') {
             steps {
                script {
                    def props = readJSON file: "packages/${env.serviceName}/package.json"
                    def app = docker.build(props['name'].replace('@', '').replace('-', '').toLowerCase(), "-f packages/${env.serviceName}/Dockerfile .")

                    env.VERSION = "v${props['version']}" 

                    manager.addShortText("v${props['version']}", "white", "navy", "1px", "navy")
                    
                    docker.withRegistry('https://rg.nl-ams.scw.cloud/kabalatech', 'docker-registry-scaleway') {
                        app.push("v${props['version']}")
                    }
                }
            }
        }
        stage ('Deply services') {
            when {
                environment name: 'deploy', value: 'true'
            }
            steps {
                script {
                    build job: '(GTMS Backend) Deploy', wait: false, parameters: [
                        string(name: 'ghprbActualCommit', value: "${ghprbActualCommit}"),
                        string(name: 'SERVICE_NAME', value: env.serviceName),
                        string(name: 'version', value: env.VERSION),
                        string(name: 'DEPLOY_ENVIRONMENT', value: env.DEPLOY_ENVIRONMENT)
                    ]
                }
            }
        }
    }
}
