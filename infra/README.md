# Echo Pages — AWS Infrastructure (Terraform)

Provisions a highly-available static SPA deployment on AWS with **Application Load Balancing** and **Auto Scaling** using a **Launch Template**.

## Resources created

| Resource | Purpose |
|---|---|
| VPC + 3 public subnets (ap-south-1a/b/c) | Multi-AZ network |
| IGW + route table | Internet egress |
| `echo-pages-alb-sg` | ALB: inbound 80 from anywhere |
| `echo-pages-ec2-sg` | EC2: inbound 80 only from ALB-SG |
| IAM role + instance profile | EC2 can pull from S3 artifacts bucket + SSM |
| `echo-pages-artifacts-*` S3 bucket | Stores built `dist/` |
| ALB + target group (HTTP:80) | Load balancing across ASG instances |
| Launch Template | Amazon Linux 2023, t3.micro, user-data installs Nginx + pulls dist |
| Auto Scaling Group | min 2 / desired 2 / max 6 across 3 AZs |
| Target tracking policy | `ALBRequestCountPerTarget ≈ 1000` |
| CPU step scaling alarm + policies | >70% out (+2), <30% in (-1) |
| `echo-pages-tfstate` S3 bucket + `echo-pages-tflock` DynamoDB | Remote state + locking |

## Deploying via GitHub Actions (recommended — no local Terraform needed)

Two workflows handle everything from a GitHub repo:

| Workflow | Triggers | What it does |
|---|---|---|
| `.github/workflows/terraform-plan.yml` | PRs touching `infra/`, `nginx/`, or the workflows themselves | `terraform plan` and posts the plan back as a PR comment. Does NOT touch AWS. |
| `.github/workflows/terraform-apply.yml` | Push to `main` (or manual `workflow_dispatch`) | Self-bootstraps state bucket/lock table, then `terraform apply -auto-approve`. Publishes `app_url`, `artifacts_bucket`, and `asg_name` to the workflow summary. |
| `.github/workflows/deploy.yml` | Push to `main` | Builds the app with `API_KEY`, syncs `dist/` to S3, triggers an ASG instance refresh. **Requires** `ARTIFACTS_BUCKET` and `ASG_NAME` secrets (set after first `terraform apply` succeeds). |

### Required GitHub Actions secrets

(repo → Settings → Secrets and variables → Actions)

| Secret | Where it comes from |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM user with the policy in "IAM permissions" below |
| `AWS_SECRET_ACCESS_KEY` | matching secret key |
| `AWS_REGION` | `ap-south-1` |
| `API_KEY` | Gemini API key — https://aistudio.google.com/apikey |
| `ARTIFACTS_BUCKET` | output of first `terraform apply` — `terraform output artifacts_bucket` (echoed to workflow summary) |
| `ASG_NAME` | output of first `terraform apply` — `terraform output asg_name` (echoed to workflow summary) |

### IAM permissions for the Actions AWS credentials

The IAM user whose keys you set as `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` needs (minimum):

- `ec2:*` — VPC, subnets, ALB, target group, launch template, ASG, internet gateway, route tables, security groups
- `elasticloadbalancing:*` — ALB and listener management
- `autoscaling:*` — ASG, scaling policies, instance refresh
- `iam:*` (limited to `echo-pages-*` resources) + `iam:CreateServiceLinkedRole` for `autoscaling.amazonaws.com`
- `s3:*` on `arn:aws:s3:::echo-pages-*`
- `dynamodb:*` on `arn:aws:dynamodb:ap-south-1:*:table/echo-pages-tflock`
- `cloudwatch:PutMetricAlarm`, `cloudwatch:DescribeAlarms`, `cloudwatch:DeleteAlarms`
- `ssm:GetParameters` on `arn:aws:ssm:ap-south-1:::parameter/aws/service/ami-amazon-linux-latest/*`

There is no built-in AWS managed policy that exactly matches; the easiest path for a personal project is a single inline policy with the actions above. Tighter leveled access is possible by splitting into multiple users, but that's beyond scope here.

### First-run ordering

1. Push infra + workflows to `main` → `terraform-apply.yml` runs.
   - It self-bootstraps `echo-pages-tfstate` + `echo-pages-tflock` (idempotent on subsequent runs).
   - Provisions all infra. ASG instances boot and serve a **placeholder page** (because no real `dist/` is in S3 yet — `build_rebuild_on_apply=false` in CI).
   - The workflow summary shows `app_url`, `ARTIFACTS_BUCKET`, and `ASG_NAME`.
2. Copy `ARTIFACTS_BUCKET` and `ASG_NAME` values from the workflow summary into the repo's Actions secrets.
3. Re-run the `deploy.yml` workflow (push any code change, or click "Run workflow" manually):
   - Builds the app with `API_KEY`, uploads `dist/` to S3, triggers ASG instance refresh.
   - New instances pull real artifacts → app goes live at `app_url`.

### Local `terraform apply` (optional alternative)

If you'd rather run Terraform locally instead of via GitHub Actions:

```bash
export AWS_ACCESS_KEY_ID=<your_aws_access_key_id>
export AWS_SECRET_ACCESS_KEY=<your_aws_secret_access_key>
export AWS_REGION=ap-south-1
export API_KEY=<your_gemini_api_key>
export GEMINI_API_KEY=$API_KEY

# Local applies can ALSO build+seed the artifacts bucket in one shot —
# flip this to true and provide Node 20+ locally:
export TF_VAR_build_rebuild_on_apply=true

cd infra/terraform
terraform init    # see "First-run (bootstrap chicken-and-egg)" below if state bucket missing
terraform apply
```

## Prerequisites on the machine running `terraform apply`

1. **Terraform** ≥ 1.5 — https://developer.hashicorp.com/terraform/downloads
2. **AWS CLI v2** configured (`aws configure`) with permissions to create VPC, EC2, S3, IAM, ALB, DynamoDB, CloudWatch resources.
3. **Node.js 20+** and **npm** — the bootstrap `null_resource` runs `npm ci && npm run build` and `aws s3 sync` locally on `terraform apply` (only when `build_rebuild_on_apply = true`).
4. **The Gemini API key** — set as an environment variable before applying:
   ```bash
   export API_KEY="<your_gemini_api_key>"        # consumed by Vite at build time
   export GEMINI_API_KEY="$API_KEY"
   ```

## First-run (bootstrap chicken-and-egg)

The Terraform backend (`backend "s3" {}` in `versions.tf`) references the state bucket and DynamoDB lock table that *this same config* creates. The very first `terraform init` therefore fails because the bucket doesn't exist yet. Two paths:

### Recommended: bootstrap state first, then switch to remote
```bash
cd infra/terraform

# Step 1: temporarily comment out the `backend "s3" { ... }` block in versions.tf
#         (or run with the local backend).
terraform init
terraform apply -target=aws_s3_bucket.tfstate \
                -target=aws_s3_bucket_versioning.tfstate \
                -target=aws_s3_bucket_public_access_block.tfstate \
                -target=aws_s3_bucket_server_side_encryption_configuration.tfstate \
                -target=aws_dynamodb_table.tflock
# (say yes) — creates the state bucket + lock table.

# Step 2: now uncomment the `backend "s3" {}` block in versions.tf and
terraform init -migrate-state   # migrates local state to S3 → uses dynamodb lock

# Step 3: apply the rest
terraform apply
```

### Alternative: pre-create state bucket/table by hand
Use the AWS console or CLI to create `echo-pages-tfstate` (versioned, AES256, public access blocked) and a `echo-pages-tflock` DynamoDB table (`LockID` string PK, on-demand). Then `terraform init` works directly.

## Full deployment

```bash
export API_KEY="..."
export GEMINI_API_KEY="$API_KEY"
cd infra/terraform
terraform init
terraform plan  -out tfplan
terraform apply tfplan
```

When complete, `terraform output app_url` gives the URL — open it in a browser.

## Updating the running app

Two ways:

### A. Push to `main` (CI/CD)
The GitHub Actions workflow in `.github/workflows/deploy.yml` rebuilds, syncs to S3, and triggers a rolling ASG instance refresh. See `DEPLOYMENT.md` for the secrets you need to configure in the repo.

### B. Manual rebuild + refresh
```bash
cd <repo root>
export API_KEY="..."
npm ci && npm run build
aws s3 sync dist/ "s3://<ARTIFACTS_BUCKET>/dist/" --delete

aws autoscaling start-instance-refresh \
  --auto-scaling-group-name <ASG_NAME> \
  --strategy Rolling \
  --preferences '{"InstanceWarmup":120,"MinHealthyPercentage":50}'
```
Replace `<ARTIFACTS_BUCKET>` and `<ASG_NAME>` with values from `terraform output`.

## Updating the AMI

The launch template uses the SSM-stored latest Amazon Linux 2023 AMI automatically (resolved by `data "aws_ami" "al2023"`), so each new instance gets the latest patches. To force already-running instances to pick up a new AMI:

```bash
aws autoscaling start-instance-refresh \
  --auto-scaling-group-name <ASG_NAME> \
  --strategy Rolling
```

## Teardown

⚠️ **This incurs real AWS costs while running.** Run this to avoid charges:

```bash
# Empty the artifacts bucket first (versioned)
aws s3 rm "s3://$(terraform output -raw artifacts_bucket)" --recursive
terraform destroy
aws s3 rm "s3://echo-pages-tfstate" --recursive   # after destroy if bucket isn't force_destroyed
aws dynamodb delete-table --table-name echo-pages-tflock
```

## Cost estimate (ap-south-1)

| Item | Qty | Approx/month |
|---|---|---|
| t3.micro EC2 | 2 | $7.60 |
| Application Load Balancer | 1 | $11.50 |
| S3 (small artifacts) | 1 | $0.10 |
| Data transfer (~modest) | – | ~$2 |
| **Total** | | **~$21/month** |

Billed only while resources exist. Run teardown above to stop charges.

## Files

```
infra/terraform/
├── versions.tf              # providers + remote backend config
├── variables.tf             # all inputs + defaults
├── terraform.tfvars.example # copy to terraform.tfvars to override
├── network.tf               # VPC, 3 public subnets, IGW, routes
├── security.tf              # ALB-SG (in 80/0.0.0.0/0), EC2-SG (in 80 from ALB)
├── iam.tf                   # EC2 role: s3:GetObject on artifacts + SSM core
├── s3.tf                    # artifacts bucket + state bucket + lock table
├── alb.tf                   # ALB + HTTP listener + target group (incl. commented ACM+HTTPS)
├── launch-template.tf       # AL2023 AMI, t3.micro, instance profile, tags
├── userdata.sh.tpl          # user-data: install nginx, s3 sync dist, enable
├── autoscaling.tf           # ASG + target tracking + CPU step scaling
├── bootstrap.tf             # null_resource: build + sync dist on first apply
└── outputs.tf               # ALB DNS, ASG name, bucket name, ...
```
