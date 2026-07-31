# ──────────────────────────────────────────────────────────────────
# Application Load Balancer — internet-facing, HTTP (port 80).
#
# Today: HTTP only (no domain → no ACM cert). ALB default DNS is the entry URL.
# Future: when you own a domain, uncomment the ACM cert block + the HTTPS
#   listener and provide `domain_name` + `hosted_zone_id` in tfvars.
# ──────────────────────────────────────────────────────────────────

resource "aws_lb" "this" {
  name               = "${var.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"

  subnets         = aws_subnet.public[*].id
  security_groups = [aws_security_group.alb.id]

  idle_timeout_seconds = 60

  tags = {
    Name = "${var.name_prefix}-alb"
  }
}

resource "aws_lb_target_group" "this" {
  name        = "${var.name_prefix}-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.this.id
  target_type = "instance"

  # Health check hits /health which Nginx returns 200 for trivially.
  health_check {
    enabled             = true
    path                = var.health_check_path
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  # Faster deregistration so deployments bleed less traffic.
  deregistration_delay = 60

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 3600
    enabled         = false
  }

  tags = {
    Name = "${var.name_prefix}-tg"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this.arn
  }

  tags = {
    Name = "${var.name_prefix}-http-listener"
  }
}

# ── HTTPS / ACM (DISABLED — enable when you own a domain) ─────────
# When ready:
#   1. Provide var.domain_name and var.hosted_zone_id.
#   2. Uncomment the certificate + https_listener + route53_alias blocks.
#   3. Remove or comment the http listener's forward action and optionally
#      make it a 301 redirect to https.

# resource "aws_acm_certificate" "this" {
#   domain_name               = var.domain_name
#   validation_method         = "DNS"
#   subject_alternative_names = ["www.${var.domain_name}"]
#
#   lifecycle {
#     create_before_destroy = true
#   }
# }

# resource "aws_route53_record" "cert_validation" {
#   for_each = {
#     for dvo in aws_acm_certificate.this.domain_validation_options : dvo.domain_name => {
#       name   = dvo.resource_record_name
#       record = dvo.resource_record_value
#       type   = dvo.resource_record_type
#     }
#   }
#
#   zone_id = var.hosted_zone_id
#   name    = each.value.name
#   type    = each.value.type
#   records = [each.value.record]
#   ttl     = 60
# }
#
# resource "aws_acm_certificate_validation" "this" {
#   certificate_arn         = aws_acm_certificate.this.arn
#   validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
# }
#
# resource "aws_lb_listener" "https" {
#   load_balancer_arn = aws_lb.this.arn
#   port              = 443
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
#   certificate_arn   = aws_acm_certificate_validation.this.certificate_arn
#
#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.this.arn
#   }
# }
#
# resource "aws_route53_record" "alias" {
#   zone_id = var.hosted_zone_id
#   name    = var.domain_name
#   type    = "A"
#
#   alias {
#     name                   = aws_lb.this.dns_name
#     zone_id                = aws_lb.this.zone_id
#     evaluate_target_health = true
#   }
# }
