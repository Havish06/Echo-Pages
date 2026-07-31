# ──────────────────────────────────────────────────────────────────
# Launch Template — golden config for every EC2 instance the ASG spawns.
#   AMI    : latest Amazon Linux 2023 x86_64 (resolved via SSM param)
#   Type   : var.instance_type (t3.micro by default)
#   SG     : echo-pages-ec2-sg (80 only from ALB)
#   Profile: echo-pages-ec2-profile (s3:GetObject on artifacts bucket)
#   Userdata: see userdata.sh.tpl — installs nginx + s3 syncs dist/
# ──────────────────────────────────────────────────────────────────

# Always resolve the most recent Amazon Linux 2023 AMI for this region.
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

# An optional key pair for emergency SSH can be set with var.key_name;
# otherwise instances boot without SSH (SSM Session Manager is enabled
# via the AmazonSSMManagedInstanceCore policy attached to the role).

resource "aws_launch_template" "this" {
  name          = "${var.name_prefix}-lt"
  image_id      = data.aws_ami.al2023.id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2.name
  }

  # Pull latest dist/ on every fresh instance (and on instance refresh).
  user_data = base64encode(templatefile("${path.module}/userdata.sh.tpl", {
    artifacts_bucket = local.artifacts_bucket_name
    artifacts_key    = local.artifacts_key
    nginx_conf       = base64encode(file("${var.app_source_dir}/nginx/nginx.conf"))
    default_conf     = base64encode(file("${var.app_source_dir}/nginx/default.conf"))
  }))

  # Spot-friendly: instances can be terminated/replaced cleanly.
  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 8
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }

  monitoring {
    enabled = true
  }

  # Graceful handling: don't count an instance as InService until Nginx is up.
  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  # Optional SSH key (only if var.key_name is provided).
  key_name = var.key_name == "" ? null : var.key_name

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name = "${var.name_prefix}-instance"
    }
  }

  tag_specifications {
    resource_type = "volume"

    tags = {
      Name = "${var.name_prefix}-volume"
    }
  }

  # Replace instances when the launch template changes (e.g., new AMI).
  update_default_version = true

  lifecycle {
    create_before_destroy = true
  }
}
