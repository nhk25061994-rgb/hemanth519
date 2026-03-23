# nitara-todo-demo

Todo REST API — Nitara GitOps demo project.
**One repo, one folder, push to GitHub and show your TL.**

---

## Architecture (what to tell your TL)

```
Developer pushes code
        │
        ▼
Jenkins (Vmbr-20)          ← CI only
  ├── npm install
  ├── npm test              ← stops here if tests fail
  ├── docker build + push   ← pushes image to registry
  └── commits new image tag to k8s/values/dev-values.yaml
                │
                ▼
        GitHub (this repo)
                │
                ▼ ArgoCD watches this repo
        ArgoCD (Vmbr-20)   ← CD only
          ├── detects new commit
          ├── applies Helm chart (k8s/) to DEV cluster
          └── marks app Healthy when /health probe passes
                │
                ▼
        DEV cluster (Vmbr-30)   ← auto-sync ON
        UAT cluster (Vmbr-40)   ← manual promote
```

**Key point for TL:**
> "Jenkins does CI — build and test.
>  ArgoCD does CD — deploy to Kubernetes.
>  They never overlap. Git is the source of truth."

---

## Folder structure (one repo, everything here)

```
nitara-todo-demo/
│
├── src/
│   ├── server.js          ← starts the Express server
│   └── app.js             ← all API routes
│
├── test/
│   └── app.test.js        ← Jest tests for all endpoints
│
├── k8s/                   ← ArgoCD reads this folder
│   ├── Chart.yaml         ← Helm chart metadata
│   ├── templates/
│   │   ├── deployment.yaml  ← K8s Deployment
│   │   ├── service.yaml     ← K8s Service (ClusterIP)
│   │   └── ingress.yaml     ← K8s Ingress (nginx)
│   └── values/
│       ├── dev-values.yaml  ← DEV config (Jenkins updates image.tag)
│       └── uat-values.yaml  ← UAT config (manually promoted)
│
├── argocd/
│   ├── application-dev.yaml  ← ArgoCD app → Vmbr-30 DEV cluster
│   └── application-uat.yaml  ← ArgoCD app → Vmbr-40 UAT cluster
│
├── Dockerfile             ← Jenkins builds this
├── Jenkinsfile            ← CI pipeline (install → test → build → update tag)
├── package.json
└── README.md
```

---

## Run locally

```bash
npm install
npm run dev
# API at http://localhost:3000
```

## Test the API

```bash
# Health check
curl http://localhost:3000/health

# Create a todo
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Setup ArgoCD on Vmbr-20"}'

# List todos
curl http://localhost:3000/todos

# Complete a todo (replace 1 with actual id)
curl -X PUT http://localhost:3000/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Delete a todo
curl -X DELETE http://localhost:3000/todos/1
```

## Run tests

```bash
npm test
```

---

## One-time setup on Vmbr-20

### 1. Push this repo to GitHub

```bash
git init
git add .
git commit -m "feat: initial nitara-todo-demo"
gh repo create nitara-todo-demo --private --source=. --push
```

### 2. Update YOUR-ORG in these files

```
Jenkinsfile               → line: git push https://...YOUR-ORG...
argocd/application-dev.yaml → repoURL
argocd/application-uat.yaml → repoURL
```

### 3. Apply ArgoCD applications

```bash
# On Vmbr-20 management cluster
kubectl apply -f argocd/application-dev.yaml -n argocd
kubectl apply -f argocd/application-uat.yaml -n argocd

# Check status
argocd app list
# nitara-todo-dev   Synced   Healthy
# nitara-todo-uat   OutOfSync (waiting for first promote)
```

### 4. Add Jenkins credentials

```
registry-creds   → Username/Password for docker registry
github-creds     → Username/Password (or token) for GitHub
```

### 5. Create Jenkins pipeline

```
Jenkins → New Item → nitara-todo-demo → Pipeline
→ Pipeline from SCM → Git
→ Repo URL: https://github.com/YOUR-ORG/nitara-todo-demo.git
→ Branch: */main
→ Script Path: Jenkinsfile
```

---

## Promote DEV → UAT

```bash
# Get current image tag from DEV
DEV_TAG=$(grep 'tag:' k8s/values/dev-values.yaml | awk '{print $2}' | tr -d '"')

# Update UAT values
sed -i "s|^  tag:.*|  tag: \"${DEV_TAG}\"|" k8s/values/uat-values.yaml

git add k8s/values/uat-values.yaml
git commit -m "promote(uat): nitara-todo-demo → ${DEV_TAG}"
git push

# Manually trigger sync in ArgoCD
argocd app sync nitara-todo-uat
```

---

## API endpoints

| Method | Path        | Description          |
|--------|-------------|----------------------|
| GET    | /health     | Liveness probe (K8s) |
| GET    | /todos      | List all todos       |
| GET    | /todos/:id  | Get one todo         |
| POST   | /todos      | Create todo          |
| PUT    | /todos/:id  | Update / complete    |
| DELETE | /todos/:id  | Delete todo          |
