# Kubernetes Deployment

Guide to deploy the Transactions API on a local Kubernetes cluster using Docker Desktop or Minikube.

## Prerequisites

- Docker Desktop with Kubernetes enabled, **or** Minikube installed
- `kubectl` CLI configured and pointing to your local cluster

### Enable Kubernetes in Docker Desktop

1. Open Docker Desktop → Settings → Kubernetes
2. Check **Enable Kubernetes**
3. Click **Apply & Restart**
4. Wait until the Kubernetes status indicator turns green

## Deploy

### 1. Build the Docker image

```bash
docker build -t transactions-api .
```

> The Deployment uses `imagePullPolicy: Never`, so Kubernetes will use the locally built image instead of pulling from a registry.

### 2. Apply the manifests

```bash
kubectl apply -f k8s/
```

This creates:
- **ConfigMap** with non-sensitive environment variables
- **Secret** with database credentials (placeholder values)
- **Deployment** with 2 replicas, health probes, and resource limits
- **Service** (ClusterIP) exposing the pods on port 80

### 3. Verify the deployment

```bash
# Check pods are Running
kubectl get pods -l app=transactions-api

# Check the service
kubectl get svc transactions-api

# View pod logs
kubectl logs -l app=transactions-api --tail=50
```

### 4. Access the API and view logs

Run `port-forward` in the background so you can use the same terminal for logs and requests:

```bash
# Port-forward in background
kubectl port-forward svc/transactions-api 3000:80 &

# Follow logs in real time
kubectl logs -l app=transactions-api --tail=50 -f
```

In a separate terminal, test the endpoints:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```

> **Tip:** To stop the background port-forward, run `kill %1` or `fg` then `Ctrl+C`.

## Updating the Secret

The `k8s/secret.yaml` contains placeholder credentials. To set real values:

```bash
# Encode your value
echo -n 'my-real-password' | base64

# Edit k8s/secret.yaml with the encoded value, then reapply
kubectl apply -f k8s/secret.yaml

# Restart pods to pick up the new secret
kubectl rollout restart deployment/transactions-api
```

## Cleanup

```bash
kubectl delete -f k8s/
```

## Notes

- The Deployment requires a PostgreSQL database accessible from within the cluster. For local testing, you can run PostgreSQL via `docker compose up postgres` or deploy a separate PostgreSQL pod.
- `ClusterIP` service is intended for internal cluster communication. For external access, use `port-forward` (development) or change the service type to `NodePort` / `LoadBalancer`.
- Resource limits (`128Mi`–`256Mi` memory, `100m`–`250m` CPU) are sized for local development. Adjust for production workloads.
