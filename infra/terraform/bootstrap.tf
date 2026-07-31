# ──────────────────────────────────────────────────────────────────
# Bootstrap — OPTIONAL local build + sync of dist/ into the S3 artifacts
# bucket. Only runs when var.build_rebuild_on_apply = true (default false).
#
# Default mode (false):
#   GitHub Actions handles the build via .github/workflows/deploy.yml.
#   terraform apply only provisions infra; EC2 user-data shows a placeholder
#   page until the first deploy workflow uploads real artifacts.
#
# Local mode (true):
#   Run `terraform apply` locally with Node 20+ installed to also build the
#   app and seed artifacts in one shot. Useful for first-time setup without
#   GitHub Actions, or for offline-style validation.
# ──────────────────────────────────────────────────────────────────

resource "null_resource" "build_and_sync" {
  count = var.build_rebuild_on_apply ? 1 : 0

  # Re-run only when explicitly requested via the trigger; this keeps the
  # null_resource from re-running on every apply when disabled (count = 0).
  triggers = {
    always_run = timestamp()
    bucket     = local.artifacts_bucket_name
  }

  # Need the bucket + IAM permission to exist before we can write.
  depends_on = [
    aws_s3_bucket.artifacts,
    aws_s3_bucket_versioning.artifacts,
  ]

  # 1) install deps + build locally → produces dist/
  provisioner "local-exec" {
    working_dir = var.app_source_dir
    interpreter = ["bash", "-c"]
    command     = <<-EOT
      set -euo pipefail
      echo ">>> npm ci"
      npm ci
      echo ">>> npm run build (API_KEY/GEMINI_API_KEY passed via env, optional)"
      npm run build
      test -d ./dist || { echo "Build failed: ./dist missing"; exit 1; }
      echo ">>> build OK"
    EOT
  }

  # 2) sync dist/ to the artifacts bucket
  provisioner "local-exec" {
    working_dir = var.app_source_dir
    interpreter = ["bash", "-c"]
    command     = <<-EOT
      set -euo pipefail
      aws s3 sync ./dist/ "s3://${local.artifacts_bucket_name}/${local.artifacts_key}" \
        --delete --no-progress
      echo ">>> synced to s3://${local.artifacts_bucket_name}/${local.artifacts_key}"
    EOT
  }
}
