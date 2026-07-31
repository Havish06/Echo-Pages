# ──────────────────────────────────────────────────────────────────
# Echo Pages — input variables
# ──────────────────────────────────────────────────────────────────

variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "ap-south-1"
}

variable "name_prefix" {
  description = "Prefix applied to every named AWS resource."
  type        = string
  default     = "echo-pages"
}

variable "vpc_cidr" {
  description = "CIDR for the VPC."
  type        = string
  default     = "10.200.0.0/22"
}

variable "availability_zones" {
  description = "AZs (must be at least 3 for the ASG span)."
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
}

variable "public_subnet_cidrs" {
  description = "One CIDR per AZ for public subnets."
  type        = list(string)
  default     = ["10.200.0.0/26", "10.200.0.64/26", "10.200.0.128/26"]
}

variable "instance_type" {
  description = "EC2 instance size for the ASG."
  type        = string
  default     = "t3.micro"
}

variable "asg_min_size" {
  description = "Minimum number of EC2 instances (must be >= 2 for HA)."
  type        = number
  default     = 2
}

variable "asg_desired_capacity" {
  description = "Steady-state instance count."
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Maximum number of instances to scale out to."
  type        = number
  default     = 6
}

variable "target_request_count_per_target" {
  description = "Average requests-per-target the ALB target group should aim for (target-tracking)."
  type        = number
  default     = 1000
}

variable "cpu_scale_out_threshold" {
  description = "Avg CPU % above which the ASG scales out."
  type        = number
  default     = 70
}

variable "cpu_scale_in_threshold" {
  description = "Avg CPU % below which the ASG scales in."
  type        = number
  default     = 30
}

variable "health_check_path" {
  description = "ALB health-check path served by Nginx."
  type        = string
  default     = "/health"
}

variable "build_rebuild_on_apply" {
  description = <<EOT
When true, a null_resource runs `npm ci && npm run build` and syncs dist/ to the
S3 artifacts bucket during `terraform apply`. Requires Node 20+ and AWS CLI on
the machine running Terraform.

Default: false — GitHub Actions (deploy.yml) builds the app instead. Set to
true only when running `terraform apply` locally and you want it to also seed
the first artifact.
EOT
  type        = bool
  default     = false
}

variable "app_source_dir" {
  description = "Absolute or relative path to the Echo Pages app source (parent of infra/)."
  type        = string
  default     = "../.."
}

variable "key_name" {
  description = "Optional EC2 key pair name for emergency SSH. Leave empty to rely on SSM Session Manager only."
  type        = string
  default     = ""
}

# ── Optional: enable when you own a domain ─────────────────────────
# These are not used today (no TLS) but documented here so you only need
# to provide values + uncomment blocks in alb.tf to enable HTTPS.

variable "domain_name" {
  description = "(Optional) Apex domain, e.g. echo-pages.com. Leave empty to keep ALB DNS only."
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "(Optional) Route 53 hosted zone ID for domain_name."
  type        = string
  default     = ""
}
