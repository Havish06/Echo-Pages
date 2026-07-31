# ──────────────────────────────────────────────────────────────────
# Auto Scaling Group — the heart of the auto-scaling design.
#
#   Capacity : min 2, desired 2, max 6  → baseline HA (2 AZs minimum) + headroom
#   Spread   : across all 3 AZs in ap-south-1
#   Attached : ALB target group (instances register on launch)
#   Grace    : 120s before EC2 health checks count, 300s for ELB health
#
# Scaling policies (two complementary):
#   A) Target tracking on ALBRequestCountPerTarget ≈ 1000
#      → scales smoothly with traffic volume.
#   B) Step scaling on CPU utilization:
#        >70% for 2 datapoints  → +2 instances
#        <30% for 2 datapoints  → -1 instance
#      → reacts to CPU pressure that load-based policy may miss for static
#        content (e.g., expensive build/sync at first boot).
# ──────────────────────────────────────────────────────────────────

locals {
  az_count = length(var.availability_zones)
}

resource "aws_autoscaling_group" "this" {
  name                = "${var.name_prefix}-asg"
  vpc_zone_identifier = aws_subnet.public[*].id

  min_size                  = var.asg_min_size
  desired_capacity          = var.asg_desired_capacity
  max_size                  = var.asg_max_size
  default_cooldown          = 60
  health_check_grace_period = 120
  health_check_type         = "ELB"
  # Forces ELB health checks to override EC2 (so Nginx serving = healthy).
  force_delete = true

  # Bind this ASG to the launch template (always use its latest version).
  launch_template {
    id      = aws_launch_template.this.id
    version = "$Latest"
  }

  # Attach to the ALB target group → registered automatically.
  target_group_arns = [aws_lb_target_group.this.arn]

  # Spread instances across AZs for HA.
  placement_strategy = "spread"

  tag {
    key                 = "Name"
    value               = "${var.name_prefix}-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = "echo-pages"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
    # Ignore desired_capacity drift from manual scaling adjustments;
    # capacity is managed by the scaling policies below.
    ignore_changes = [desired_capacity]
  }
}

# ──────────────────────────────────────────────────────────────────
# Policy A — target tracking on requests-per-target
# (scales out/in to keep ~1000 req/target; slowlySeeing load → +instance)
# ──────────────────────────────────────────────────────────────────
resource "aws_autoscaling_policy" "request_count" {
  name                   = "${var.name_prefix}-asg-reqcount"
  autoscaling_group_name = aws_autoscaling_group.this.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label        = "${aws_lb.this.arn_suffix}/${aws_lb_target_group.this.arn_suffix}"
    }
    target_value = var.target_request_count_per_target

    # Conservative: don't flap.
    disable_scale_in = false
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# ──────────────────────────────────────────────────────────────────
# Policy B — CPU step scaling (complements load-based for first-boot & spikes)
# ──────────────────────────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.name_prefix}-cpu-high"
  namespace           = "AWS/EC2"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 2
  threshold           = var.cpu_scale_out_threshold
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.this.name
  }

  alarm_actions = [aws_autoscaling_policy.scale_out.arn]
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${var.name_prefix}-cpu-low"
  namespace           = "AWS/EC2"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 5
  threshold           = var.cpu_scale_in_threshold
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.this.name
  }

  alarm_actions = [aws_autoscaling_policy.scale_in.arn]
}

resource "aws_autoscaling_policy" "scale_out" {
  name                   = "${var.name_prefix}-asg-scale-out"
  autoscaling_group_name = aws_autoscaling_group.this.name
  adjustment_type        = "ChangeInCapacity"
  policy_type            = "StepScaling"
  cooldown               = 60

  step_adjustment {
    metric_interval_lower_bound = 0
    scaling_adjustment          = 2 # add 2 instances
  }
}

resource "aws_autoscaling_policy" "scale_in" {
  name                   = "${var.name_prefix}-asg-scale-in"
  autoscaling_group_name = aws_autoscaling_group.this.name
  adjustment_type        = "ChangeInCapacity"
  policy_type            = "StepScaling"
  cooldown               = 300

  step_adjustment {
    metric_interval_upper_bound = 0
    scaling_adjustment          = -1 # remove 1 instance at a time
  }
}
