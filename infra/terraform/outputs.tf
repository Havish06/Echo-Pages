# ──────────────────────────────────────────────────────────────────
# Outputs — the values you'll actually use after `terraform apply`.
# ──────────────────────────────────────────────────────────────────

output "alb_dns_name" {
  description = "Public DNS name of the ALB. Open this in a browser to reach Echo Pages."
  value       = aws_lb.this.dns_name
}

output "alb_dns_arn_suffix" {
  description = "ALB ARN suffix (used for CloudWatch metrics)."
  value       = aws_lb.this.arn_suffix
}

output "target_group_arn" {
  description = "Target group ARN (instances register here)."
  value       = aws_lb_target_group.this.arn
}

output "target_group_name" {
  description = "Target group name (for console navigation)."
  value       = aws_lb_target_group.this.name
}

output "asg_name" {
  description = "Auto Scaling Group name."
  value       = aws_autoscaling_group.this.name
}

output "asg_min_max" {
  description = "ASG capacity bounds."
  value       = "min ${var.asg_min_size} / desired ${var.asg_desired_capacity} / max ${var.asg_max_size}"
}

output "launch_template_name" {
  description = "Launch template name."
  value       = aws_launch_template.this.name
}

output "artifacts_bucket" {
  description = "S3 bucket holding the built dist/. CI/CD writes here on every push."
  value       = local.artifacts_bucket_name
}

output "ec2_instance_profile" {
  description = "EC2 instance profile (for SSM / debugging)."
  value       = aws_iam_instance_profile.ec2.name
}

output "vpc_id" {
  description = "VPC ID."
  value       = aws_vpc.this.id
}

output "public_subnets" {
  description = "Public subnet IDs (EC2 + ALB live here)."
  value       = aws_subnet.public[*].id
}

output "app_url" {
  description = "Full application URL (HTTP only — no TLS without a domain)."
  value       = "http://${aws_lb.this.dns_name}"
}
