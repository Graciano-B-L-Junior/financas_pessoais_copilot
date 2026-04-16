pipeline {
    agent any

    environment {
        SONAR_HOST_URL = credentials('sonar-host-url')
        SONAR_TOKEN    = credentials('sonar-token')
        DOCKER_IMAGE   = "financas-pessoais"
        DOCKER_TAG     = "${env.BRANCH_NAME}-${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend: Lint') {
            steps {
                dir('backend') {
                    sh '''
                        python -m pip install -r requirements-dev.txt -q
                        black --check .
                        isort --check-only .
                        flake8 .
                    '''
                }
            }
        }

        stage('Backend: Testes') {
            steps {
                dir('backend') {
                    sh '''
                        python -m pip install -r requirements-dev.txt -q
                        pytest --tb=short --junitxml=reports/junit.xml
                    '''
                }
            }
            post {
                always {
                    junit 'backend/reports/junit.xml'
                }
            }
        }

        stage('Frontend: Lint') {
            steps {
                dir('frontend') {
                    sh 'npm ci --silent'
                    sh 'npm run lint'
                }
            }
        }

        stage('Frontend: Testes') {
            steps {
                dir('frontend') {
                    sh 'npm test -- --ci --coverage'
                }
            }
        }

        stage('Frontend: Build') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('SonarQube') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        sonar-scanner \
                            -Dsonar.projectKey=financas-pessoais \
                            -Dsonar.sources=backend,frontend/src \
                            -Dsonar.exclusions=**/migrations/**,**/node_modules/**,**/__pycache__/** \
                            -Dsonar.python.coverage.reportPaths=backend/coverage.xml \
                            -Dsonar.host.url=$SONAR_HOST_URL \
                            -Dsonar.login=$SONAR_TOKEN
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker: Build & Push') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    docker build -t $DOCKER_IMAGE-backend:$DOCKER_TAG ./backend
                    docker build -t $DOCKER_IMAGE-frontend:$DOCKER_TAG ./frontend
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        failure {
            echo "Pipeline falhou. Verifique os logs acima."
        }
    }
}
