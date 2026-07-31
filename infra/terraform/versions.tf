terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Remote state in S3 + DynamoDB lock. Buckets/table are created in s3.tf.
  # Re-run `terraform init` after the bootstrap bucket exists to migrate state.
  backend "s3" {
    region         = "ap-south-1"
    bucket         = "echo-pages-tfstate"
    key            = "echo-pages/terraform.tfstate"
    dynamodb_table = "echo-pages-tflock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "echo-pages"
      ManagedBy = "terraform"
    }
  }
}

provider "null" {}
provider "random" {}
