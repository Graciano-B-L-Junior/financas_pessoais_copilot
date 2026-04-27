pipeline {
  agent any

  stages {
    stage('Backend Lint') {
      agent { docker { image 'python:3.12-slim' } }
      steps {
        dir('backend') {
          sh 'pip install -r requirements.txt'
          sh 'flake8 .'
          sh 'black --check .'
          sh 'isort --check-only .'
        }
      }
    }

    stage('Backend Tests') {
      agent { docker { image 'python:3.12-slim' } }
      steps {
        dir('backend') {
          sh 'pip install -r requirements.txt'
          sh 'pytest'
        }
      }
    }

    stage('Frontend Lint, Tests and Build') {
      agent { docker { image 'node:20-alpine' } }
      steps {
        dir('frontend') {
          sh 'npm ci'
          sh 'npm run lint'
          sh 'npm test'
          sh 'npm run build'
        }
      }
    }

    stage('SonarQube') {
      steps {
        echo 'Integrar scanner do SonarQube conforme o ambiente Jenkins.'
      }
    }

    stage('Docker Compose Validation') {
      steps {
        sh 'docker compose config'
      }
    }
  }
}