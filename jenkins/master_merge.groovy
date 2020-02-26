def branch = '';
def changedJSON = '';

pipeline {
    agent { docker { image 'docker-registry.kabala.tech/gtms-be-builder:latest' } }

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
        stage ('Install dependencies') {
            steps {
                script {
                    sh "yarn install"
                }
            }
        }
        stage ('Look for services to build and deploy') {
            steps {
                script {
                    def changed = sh returnStdout: true, script: "lerna changed --all --json"
                    StringBuilder services = new StringBuilder()
                    changedJSON = new groovy.json.JsonSlurperClassic().parseText(changed)

                    println(changedJSON.toString())

                    changedJSON.each{
                        if (it.name.contains("@gtms/service-")) {
                            services.append("${it.name},")
                        }
                    }

                    println(services)
                }
            }
        }
        stage ('Release') {
            steps {
                script {
                    sshagent(['jenkins-ssh-key']) {
                        sh "git checkout ${branch}"
                        //sh "lerna version --no-commit-hooks"
                    }
                }
            }
        }
    }
}
