# ──────────────────────────────────────────────────────────────────
# S3 buckets:
#   1. echo-pages-artifacts   — host dist/ build output that EC2 pulls from.
#   2. echo-pages-tfstate      — Terraform remote state (used by backend "s3"{}).
#   3. echo-pages-tflock         — DynamoDB table for state locking.
#
# Note: state bucket & lock table must EXIST before Terraform backs itself
# into them. The `terraform init` command for the very first run will fail
# because the bucket doesn't exist yet. See infra/README.md "First-run".
# ──────────────────────────────────────────────────────────────────

resource "random_string" "bucket_suffix" {
  length  = 6
  special = false
  upper   = false
}

# When true, FFIE sanitation rules might want this; we just block ACLs.
resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "artifacts" {
  bucket_prefix = "${var.name_prefix}-artifacts-"
  force_destroy = true

  tags = {
    Name = "${var.name_prefix}-artifacts"
  }
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  versioning {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    id     = "expire-old-dists"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# ── Terraform state bucket (+ table) ──────────────────────────────

resource "aws_s3_bucket" "tfstate" {
  bucket        = "echo-pages-tfstate"
  force_destroy = true

  tags = {
    Name = "echo-pages-tfstate"
  }
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_dynamodb_table" "tflock" {
  name         = "echo-pages-tflock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name = "echo-pages-tflock"
  }
}

locals {
  artifacts_bucket_name = aws_s3_bucket.artifacts.id
  artifacts_key         = "dist/"
}
