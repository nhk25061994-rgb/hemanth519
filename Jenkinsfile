// ─────────────────────────────────────────────────────────────
//  Nitara CI Pipeline  —  Node.js
//  Vmbr-20 Jenkins  →  Docker Registry  →  nitara-gitops repo
// ─────────────────────────────────────────────────────────────
pipeline {
  agent any

  environment {
    APP_NAME    = 'nitara-app'
    REGISTRY    = 'registry.nitara.internal'
    IMAGE       = "${REGISTRY}/${APP_NAME}"
    GITOPS_REPO = 'git@github.com:nitara/nitara-gitops.git'
    SONAR_URL   = 'http://sonarqube.mgmt.nitara.internal'

    SHORT_SHA   = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
    IMAGE_TAG   = "${env.BRANCH_NAME}-${SHORT_SHA}-${env.BUILD_NUMBER}"
  }

  options {
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  stages {

    // ── 1. Checkout ─────────────────────────────────────────
    stage('Checkout') {
      steps { checkout scm }
    }

    // ── 2. Install dependencies ──────────────────────────────
    stage('Install') {
      steps {
        sh 'npm ci'
      }
    }

    // ── 3. Unit Tests + Coverage ─────────────────────────────
    stage('Test') {
      steps {
        sh 'npm test'
      }
      post {
        always {
          // Publish Jest results in Jenkins
          junit allowEmptyResults: true, testResults: 'coverage/junit.xml'
          publishHTML(target: [
            reportDir:   'coverage/lcov-report',
            reportFiles: 'index.html',
            reportName:  'Coverage Report'
          ])
        }
      }
    }

    // ── 4. SonarQube Scan ────────────────────────────────────
    stage('SonarQube') {
      steps {
        withSonarQubeEnv('sonarqube') {
          sh """
            npx sonar-scanner \
              -Dsonar.projectKey=${APP_NAME} \
              -Dsonar.sources=src \
              -Dsonar.tests=test \
              -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
              -Dsonar.host.url=${SONAR_URL}
          """
        }
      }
    }

    // ── 5. Quality Gate ──────────────────────────────────────
    stage('Quality Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }

    // ── 6. Docker Build & Push ───────────────────────────────
    stage('Docker Build & Push') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'registry-creds',
          usernameVariable: 'REG_USER',
          passwordVariable: 'REG_PASS'
        )]) {
          sh """
            docker login ${REGISTRY} -u ${REG_USER} -p ${REG_PASS}
            docker build -t ${IMAGE}:${IMAGE_TAG} .
            docker push  ${IMAGE}:${IMAGE_TAG}
            docker tag   ${IMAGE}:${IMAGE_TAG} ${IMAGE}:${BRANCH_NAME}-latest
            docker push  ${IMAGE}:${BRANCH_NAME}-latest
          """
        }
      }
    }

    // ── 7. Update GitOps repo ────────────────────────────────
    stage('Update GitOps') {
      when {
        anyOf {
          branch 'main'       // auto-deploys to DEV
          branch 'release/*'  // auto-deploys to UAT
        }
      }
      steps {
        script {
          def targetEnv = (env.BRANCH_NAME == 'main') ? 'dev' : 'uat'

          sshagent(['gitops-deploy-key']) {
            sh """
              rm -rf gitops-tmp
              git clone ${GITOPS_REPO} gitops-tmp
              cd gitops-tmp

              # Update image tag in the target environment values file
              sed -i 's|^  tag:.*|  tag: "${IMAGE_TAG}"|' values/${targetEnv}-values.yaml

              git config user.email "jenkins@nitara.internal"
              git config user.name  "Jenkins CI"
              git add values/${targetEnv}-values.yaml
              git commit -m "deploy(${targetEnv}): ${APP_NAME} → ${IMAGE_TAG} [skip ci]"
              git push origin main

              cd .. && rm -rf gitops-tmp
            """
          }
        }
      }
    }
  }

  post {
    success { echo "DONE: ${IMAGE}:${IMAGE_TAG} → GitOps updated" }
    failure { echo "FAILED — review logs above" }
    always  { cleanWs() }
  }
}
