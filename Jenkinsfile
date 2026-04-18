pipeline {
  agent any

  environment {
    BACKEND_DIR  = 'backend'
    FRONTEND_DIR = 'frontend'
    SONAR_HOST   = credentials('sonarqube-host')
    SONAR_TOKEN  = credentials('sonarqube-token')
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    // ── Backend quality ──────────────────────────────────────────────────────
    stage('Backend: isort + black (check)') {
      steps {
        sh '''
          docker run --rm -v "$PWD/$BACKEND_DIR":/app python:3.11-slim bash -lc \
            "pip install -q isort black && \
             isort /app --check-only --diff && \
             black /app --check --diff"
        '''
      }
    }

    stage('Backend: flake8') {
      steps {
        sh '''
          docker run --rm -v "$PWD/$BACKEND_DIR":/app python:3.11-slim bash -lc \
            "pip install -q flake8 && flake8 /app"
        '''
      }
    }

    stage('Backend: pytest') {
      steps {
        sh '''
          docker run --rm \
            -v "$PWD/$BACKEND_DIR":/app \
            --network host \
            -e DJANGO_SETTINGS_MODULE=financas_pessoais.settings \
            -e DATABASE_URL=sqlite:///test.db \
            -e SECRET_KEY=ci-only-secret-key \
            -e ALLOWED_HOSTS="*" \
            -e CORS_ALLOWED_ORIGINS="" \
            python:3.11-slim bash -lc \
            "pip install -q -r /app/requirements.txt pytest pytest-django && \
             PYTHONPATH=/app pytest /app/tests -q --tb=short \
               --junitxml=/app/test-results/junit.xml"
        '''
      }
      post {
        always {
          junit 'backend/test-results/junit.xml'
        }
      }
    }

    // ── Frontend quality ─────────────────────────────────────────────────────
    stage('Frontend: eslint') {
      steps {
        sh '''
          docker run --rm -v "$PWD/$FRONTEND_DIR":/app -w /app node:20-alpine sh -lc \
            "npm ci --silent && npx next lint --no-cache"
        '''
      }
    }

    // ── SonarQube ─────────────────────────────────────────────────────────────
    stage('SonarQube Analysis') {
      steps {
        sh '''
          docker run --rm \
            -v "$PWD":/usr/src \
            -e SONAR_HOST_URL="$SONAR_HOST" \
            -e SONAR_TOKEN="$SONAR_TOKEN" \
            sonarsource/sonar-scanner-cli:latest \
            sonar-scanner \
              -Dsonar.projectKey=financas-pessoais \
              -Dsonar.sources=backend,frontend \
              -Dsonar.exclusions="**/migrations/**,**/node_modules/**,**/__pycache__/**" \
              -Dsonar.python.coverage.reportPaths=backend/coverage.xml \
              -Dsonar.host.url="$SONAR_HOST" \
              -Dsonar.login="$SONAR_TOKEN"
        '''
      }
    }

    // ── Build images ──────────────────────────────────────────────────────────
    stage('Build Images') {
      steps {
        sh 'docker compose -f docker-compose.prod.yml build --no-cache'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'backend/test-results/*.xml', allowEmptyArchive: true
    }
    failure {
      echo 'Pipeline falhou. Verifique os logs acima.'
    }
  }
}
