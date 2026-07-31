# Echo Pages — AWS Deployment Plan

This document captures every decision made during planning. It is the source of truth for how **Echo Pages** is deployed to AWS with Load Balancing (ALB) and Auto Scaling (ASG + Launch Template).

---

## 1. Project Summary

| Aspect | Value |
|---|---|
| App type | Vite + React 19 + TypeScript SPA (client-side only) |
| Build | `vite build` → static files into `dist/` |
| Routing | Hash-based (`#/read`, `#/p/{id}`, …) — no server-side routing needed |
| Data | Supabase (hosted external) + Google Gemini AI — both called from the browser |
| Previous host | Vercel (with SPA fallback `/* → /index.html`) |
| Secret | `API_KEY` / `GEMINI_API_KEY` injected at build time via Vite `define` |

### Key architectural insight
This is a **static SPA** with no server runtime. EC2 instances only need to **serve static files** (Nginx). The Gemini API key is baked into the JS bundle at build time (same as on Vercel) — there is no server process that needs to hold secrets at runtime. The build step therefore needs the key; the running instances do not.

---

## 2. Confirmed Decisions

| Concern | Decision |
|---|---|
| IaC tool | **Terraform** |
| State backend | **Remote S3 + DynamoDB lock** |
| Artifact delivery | **S3 pull via user-data** at instance boot |
| First `dist/` seed | **Terraform builds it on apply** (null_resource runs `npm run build` + `aws s3 sync`) |
| Domain / TLS | **None — ALB default DNS, HTTP port 80** (ACM needs a domain for TLS; documented as a known limitation, with commented ACM + HTTPS blocks ready to enable) |
| Gemini API key | **Build-time injection via GitHub Actions secret** (unchanged exposure vs. Vercel) |
| AWS region | **ap-south-1 (Mumbai)** |
| Resource name prefix | `echo-pages-` |
| Scope | Full implementation in one pass: infra + Nginx + CI/CD + docs |

---

## 3. Target Architecture

```
                       ┌──────────────────────────────┐
   Internet ──────────▶│   ALB (internet-facing)      │  HTTP:80 → HTTP:80
                       │   SG: echo-pages-alb-sg        │  Health: GET /health
                       │   in 80 from 0.0.0.0/0         │
                       └───────────────┬──────────────┘
                                       │
                       ┌───────────────▼──────────────┐
                       │   Target Group (port 80)      │
                       │   protocol HTTP                │
                       │   healthcheck /health          │
                       │   deregistration_delay 60s    │
                       │   target type: instance        │
                       └───────────────┬──────────────┘
                                       │
              ┌────────────────────────┼────────────────────────┐
              ▼                        ▼                          ▼
        EC2 (ap-south-1a)       EC2 (ap-south-1b)         EC2 (ap-south-1c)
        Nginx serving dist/      Nginx serving dist/        Nginx serving dist/
        files pulled from        files pulled from          files pulled from
        s3://...artifacts/dist  s3://...artifacts/dist     s3://...artifacts/dist
              └────────────────────────┴────────────────────────┘
                                       │
                       ┌───────────────▼──────────────┐
                       │   Launch Template              │
                       │   AMI: Amazon Linux 2023      │
                       │   instance_type: t3.micro      │
                       │   IAM: s3:GetObject on artifacts bucket │
                       │   user-data installs nginx +    │
                       │   aws s3 syncs latest dist     │
                       └───────────────┬──────────────┘
                                       │
                       ┌───────────────▼──────────────┐
                       │   Auto Scaling Group           │
                       │   min 2 / desired 2 / max 6    │
                       │   across 3 AZs                 │
                       │   attached to target group     │
                       │   target tracking:              │
                       │     ALBRequestCountPerTarget ~1000│
                       │   step scaling CPU >70% out,    │
                       │     <30% in                    │
                       └──────────────────────────────┘

   CI/CD:  push to main → GitHub Actions:
            npm ci && npm run build (with API_KEY secret)
            → aws s3 sync dist/ → s3://echo-pages-artifacts/dist/
            → aws autoscaling start-instance-refresh
```

---

## 4. Phased Implementation

### Phase 1 — App changes
- `nginx/nginx.conf` — main Nginx config
- `nginx/default.conf` — server block: serve `/usr/share/nginx/html/`, SPA fallback to `/index.html`, `/health` → 200
- Update `index.html` — make OG/canonical URLs DNS-agnostic (replace `echo-pages-hav.vercel.app` with relative `/`)
- `.gitignore` — add Terraform artifacts + state files

### Phase 2 — Terraform infra (`infra/terraform/`)
- `versions.tf` — AWS provider pinned, ap-south-1
- `backend.tf` — S3 + DynamoDB remote state
- `variables.tf` + `terraform.tfvars.example`
- `network.tf` — VPC, 3 public subnets (ap-south-1a/b/c), IGW, route table
- `security.tf` — `echo-pages-alb-sg` (in 80 from 0.0.0.0/0), `echo-pages-ec2-sg` (in 80 from ALB-SG only)
- `iam.tf` — EC2 instance profile with `s3:GetObject` on artifacts bucket
- `s3.tf` — `echo-pages-artifacts` versioned private bucket (+ state bucket + lock table)
- `alb.tf` — ALB, HTTP listener → target group (port 80, `/health` healthcheck). Commented ACM + HTTPS blocks ready for future domain.
- `launch-template.tf` — Amazon Linux 2023 latest AMI (via SSM parameter), t3.micro, user-data
- `userdata.sh.tpl` — install Nginx, AWS CLI, `s3 sync`, enable Nginx
- `autoscaling.tf` — ASG (min 2 / desired 2 / max 6) across 3 subnets; target-tracking + CPU step scaling
- `bootstrap.tf` — `null_resource` runs `npm ci && npm run build` + `aws s3 sync` to seed the artifact bucket on first apply
- `outputs.tf` — ALB DNS, S3 bucket name, ASG name

### Phase 3 — CI/CD
- `.github/workflows/deploy.yml` — on push to `main`: build (with `API_KEY` secret) → `s3 sync` → `aws autoscaling start-instance-refresh`

### Phase 4 — Docs
- `infra/README.md` — prerequisites, `terraform apply`, teardown, AMI update procedure
- `DEPLOYMENT.md` — architecture, scaling behavior, update flow, known limitations, how to add a domain later

---

## 5. Known Caveats (documented in DEPLOYMENT.md)

1. **No TLS** — ALB default DNS serves HTTP only (ACM cert requires a domain). Commented ACM + HTTPS listener blocks are included in `alb.tf` for one-line enablement when you own a domain.
2. **API_KEY exposure** — baked into JS bundle at build (same as Vercel). No security regression.
3. **Terraform-builds-artifact** — `terraform apply` requires Node ≥ 20 and AWS CLI on the machine that runs it (for the bootstrap `null_resource`).
4. **Cost** — 2 × t3.micro + ALB + S3 + data transfer in ap-south-1 ≈ $15–20/month if left running. Teardown instructions provided.

---

## 6. How to Plug In a Domain Later

1. Buy / transfer a domain into Route 53 (or create a hosted zone for an existing domain).
2. Uncomment the ACM certificate block + HTTPS listener block in `alb.tf`.
3. Set `var.domain_name` and `var.hosted_zone_id` in `terraform.tfvars`.
4. `terraform apply` — cert validates via DNS, ALB listens on 443, Route 53 alias points the apex / `www` record at the ALB.
