# Echo Pages — AWS Deployment

Production-style deployment of the Echo Pages SPA on AWS, featuring **Load Balancing (ALB)**, **Launch Templates**, and **Auto Scaling Groups**. There is no server-side runtime — Nginx serves the pre-built static bundle, and the ALB + ASG make it horizontally scalable and self-healing.

> The full planning rationale is saved in [DEPLOYMENT-PLAN.md](./DEPLOYMENT-PLAN.md). The infrastructure lives in [infra/terraform/](./infra/terraform/). Quick-start is in [infra/README.md](./infra/README.md).

---

## Architecture

```
                         Internet
                            │
                            ▼
              ┌─────────────────────────────┐
              │   Application Load Balancer  │  (internet-facing)
              │   echo-pages-alb             │  HTTP:80 → HTTP:80
              │   SG: open 80 from 0/0       │
              └──────────────┬─────────────┘
                             │ forwards to target group
              ┌──────────────▼─────────────┐
              │   Target Group (port 80)   │  health check: GET /health
              │   instance type, no stick. │  deregister 60s
              └──────────────┬─────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
      EC2 (AZ-a)        EC2 (AZ-b)       EC2 (AZ-c)        Auto Scaling Group
      Nginx             Nginx            Nginx             min 2 / desired 2 / max 6
        └────────────────┴────────────────┘                Policies:
                          ▲                                  • Target tracking:
                          │                                     ALBRequestCountPerTarget ≈ 1000
        s3 sync from S3 artifacts bucket                  • CPU step scaling
                          │                                     >70% → +2,  <30% → −1
                          ▼
              ┌──────────────────────────────┐
              │   s3://echo-pages-artifacts/ │
              │      dist/                    │ ← CI/CD writes here
              └──────────────────────────────┘
```

### Traffic flow

1. Users hit the **ALB DNS name** (output of `terraform apply`).
2. ALB terminates HTTP on 80 and forwards to the target group on port 80.
3. Two (or more) **EC2 instances** sit behind the ALB. Each runs **Nginx** serving `/usr/share/nginx/html`.
4. Nginx serves the React SPA and falls back unmatched routes to `/index.html`. Hash routing (`#/…`) means there's no server-side routing.
5. `/health` is a lightweight Nginx-only 200 response used by the ALB health checker — doesn't hit React.

### Scaling behaviour

- **Baseline**: 2 healthy instances across 2+ AZs at all times → survives single-AZ failure.
- **Scale out** (`ALBRequestCountPerTarget > 1000` sustained, OR CPU > 70% for 2 minutes): group grows up to **6 instances**, preferring spread across all 3 AZs.
- **Scale in** (CPU < 30% for 5 minutes): −1 instance at a time.
- **Self-healing**: if an instance fails ELB health checks (Nginx down), ASG terminates and replaces it automatically.

---

## Files

### App-level additions
```
nginx/
├── nginx.conf          # main Nginx config (gzip, keepalive, logging)
└── default.conf        # server block: SPA fallback + /health endpoint
```
- `index.html` — OG/canonical URLs made DNS-agnostic (relative `/`)

### Infrastructure (`infra/terraform/`)
See [infra/README.md](./infra/README.md) for the full file list and per-resource explanation.

### CI/CD
```
.github/workflows/deploy.yml   # push to main → build → s3 sync → ASG instance refresh
```

---

## Deploy steps (end-to-end)

### 1. Configure AWS credentials (locally + in GitHub)

Local:
```bash
aws configure          # or use SSO / env vars
```

GitHub repo → Settings → Secrets and variables → Actions:
| Secret | Notes |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user with `s3:PutObject` on artifacts bucket + `autoscaling:StartInstanceRefresh` |
| `AWS_SECRET_ACCESS_KEY` | matching secret |
| `AWS_REGION` | `ap-south-1` |
| `API_KEY` | Gemini API key — injected at build time by Vite |
| `ARTIFACTS_BUCKET` | output of `terraform output artifacts_bucket` |
| `ASG_NAME` | output of `terraform output asg_name` |

### 2. Set the Gemini key locally and apply infra

```bash
export API_KEY="..."            # used by Vite at build time
export GEMINI_API_KEY="$API_KEY"

cd infra/terraform
terraform init                 # see infra/README.md for first-run bootstrap
terraform plan
terraform apply
# → outputs: app_url (open in browser), asg_name, artifacts_bucket
```

That single apply:
- Provisions the entire network + ALB + ASG + IAM + S3.
- Builds the SPA (`npm ci && npm run build`) and syncs `dist/` to the artifacts bucket (this requires Node 20+ on your local machine).
- EC2 instances boot, install Nginx, and pull the freshly-built bundle from S3.
- ALB health checks pass within ~30s, traffic flows.

### 3. Access the app
```bash
terraform output app_url         # → http://echo-pages-alb-xxxxxx.ap-south-1.elb.amazonaws.com
```

### 4. Subsequent deploys
Just push to `main`. The GitHub Actions workflow:
```
npm ci && npm run build  →  aws s3 sync dist/ s3://.../dist/  →  aws autoscaling start-instance-refresh
```
The ASG rolls instances in batches (default 50% checkpoints) so there's zero downtime.

---

## Known limitations

1. **No TLS** — The ALB serves HTTP only on port 80. AWS ALB requires an **ACM certificate**, and ACM certificates need a **registered domain**; with no domain owned, we use the ALB's default DNS. To enable HTTPS later, uncomment the ACM + HTTPS listener + Route 53 alias blocks in `infra/terraform/alb.tf`, provide `domain_name` and `hosted_zone_id` in `terraform.tfvars`, and `terraform apply`. The relevant code is already present and commented-out.

2. **Gemini API key is build-time-injected into the client bundle** — Same exposure as on Vercel. The key is needed by the browser to call Gemini directly; there is no server process. The CI/CD and Terraform bootstrap both expect `API_KEY` as an env var / GitHub Actions secret. No security regression vs. the previous Vercel deployment.

3. **`terraform apply` requires Node 20+ locally** — The first-run `null_resource.bootstrap` runs `npm ci && npm run build` and `aws s3 sync` from the machine that runs Terraform. After the first deploy, set `build_rebuild_on_apply = false` in `terraform.tfvars` to skip this (CI/CD handles subsequent builds).

4. **All subnets are public** — To keep the project minimal and avoid NAT gateway cost (~$32/mo), EC2 instances are in public subnets and pull from S3 via the public S3 endpoint. Security groups ensure only the ALB can reach them on port 80.

---

## How to enable HTTPS / plug in a domain later

1. Buy or transfer a domain into **Route 53** (or create a hosted zone for an existing one).
2. In `infra/terraform/terraform.tfvars`:
   ```hcl
   domain_name    = "echo-pages.com"
   hosted_zone_id = "Z0123456ABCDEF"
   ```
3. In `infra/terraform/alb.tf`, uncomment:
   - `aws_acm_certificate.this`
   - `aws_route53_record.cert_validation`
   - `aws_acm_certificate_validation.this`
   - `aws_lb_listener.https`
   - `aws_route53_record.alias`
4. (Optional) change the existing `aws_lb_listener.http` default action from `forward` to a 301 redirect to `https://…`.
5. `terraform apply` — certificate validates via DNS, ALB listens on 443, Route 53 alias points the apex at the ALB.

---

## Teardown

⚠️ Costs accrue while resources exist. To stop all charges:

```bash
cd infra/terraform
aws s3 rm "s3://$(terraform output -raw artifacts_bucket)" --recursive
terraform destroy
aws s3 rm "s3://echo-pages-tfstate" --recursive
aws dynamodb delete-table --table-name echo-pages-tflock
```

See [infra/README.md](./infra/README.md) for a cost estimate (~$21/month while running).
