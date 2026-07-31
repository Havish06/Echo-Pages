# ──────────────────────────────────────────────────────────────────
# Security groups — least privilege:
#   ALB-SG:  inbound 80 from anywhere
#   EC2-SG: inbound 80 ONLY from the ALB-SG (instances are not directly exposed)
# ──────────────────────────────────────────────────────────────────

resource "aws_security_group" "alb" {
  name        = "${var.name_prefix}-alb-sg"
  description = "Internet-facing ALB security group for Echo Pages."
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "HTTP from anywhere"
    from_port    = 80
    to_port      = 80
    protocol     = "tcp"
    cidr_blocks  = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    description = "All egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "${var.name_prefix}-alb-sg"
  }
}

resource "aws_security_group" "ec2" {
  name        = "${var.name_prefix}-ec2-sg"
  description = "EC2 security group for Echo Pages Nginx hosts."
  vpc_id      = aws_vpc.this.id

  # HTTP only from the ALB.
  ingress {
    description     = "HTTP from ALB only"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Outbound: S3 (via vpc endpoint or public) and package repos.
  egress {
    description = "All egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "${var.name_prefix}-ec2-sg"
  }
}
