# ──────────────────────────────────────────────────────────────────
# IAM — EC2 instance role granting read access to the artifacts bucket
# so user-data can `aws s3 sync` the built dist/ at boot and on refresh.
# ──────────────────────────────────────────────────────────────────

# Random suffix to guarantee IAM role / policy name uniqueness across deploys.
resource "random_string" "role_suffix" {
  length  = 6
  special = false
  upper   = false
}

data "aws_iam_policy_document" "assume" {
  statement {
    effect = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2" {
  name               = "${var.name_prefix}-ec2-role-${random_string.role_suffix.result}"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

data "aws_iam_policy_document" "s3_read_artifacts" {
  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.artifacts.arn,
      "${aws_s3_bucket.artifacts.arn}/*",
    ]
  }
}

resource "aws_iam_policy" "s3_read_artifacts" {
  name        = "${var.name_prefix}-s3-read-artifacts-${random_string.role_suffix.result}"
  description = "Allow EC2 instances to pull dist/ from the Echo Pages artifacts bucket."
  policy      = data.aws_iam_policy_document.s3_read_artifacts.json
}

resource "aws_iam_role_policy_attachment" "s3_read_artifacts" {
  role       = aws_iam_role.ec2.name
  policy_arn = aws_iam_policy.s3_read_artifacts.arn
}

# CloudWatch Agent + Systems Manager managed instance core permissions.
resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${var.name_prefix}-ec2-profile-${random_string.role_suffix.result}"
  role = aws_iam_role.ec2.name
}
