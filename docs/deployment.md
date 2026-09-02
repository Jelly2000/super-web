# Deployment — S3 + CloudFront

`super-web`'s shell (`packages/shell`) deploys as a static build to S3, served through
CloudFront. This replaces the earlier tentative Netlify plan (see
[ARCHITECTURE.md](../../docs/ARCHITECTURE.md#deployment)).

## CI/CD workflows

Three workflows in [.github/workflows/](../.github/workflows/):

| Workflow | Trigger | Does |
|---|---|---|
| `pr-release.yml` | PR opened/updated against `master` | Build, test, type-check, deploy to `s3://$BUCKET/pr/<number>/`, invalidate that path, comment the preview URL on the PR |
| `pr-closed.yml` | PR closed (merged or not) | Delete `s3://$BUCKET/pr/<number>/`, invalidate that path, update the PR comment |
| `master-release.yml` | Push to `master`, or manual dispatch | Build, test, type-check, sync to the bucket root (excluding `pr/*`), invalidate `/*` |

All three assume the bucket and CloudFront distribution already exist (provisioned once,
manually or via IaC — not by these workflows) and authenticate to AWS via OIDC, not
long-lived access keys.

## One-time AWS setup

1. **S3 bucket** — private, versioning optional. No static-website-hosting mode needed;
   CloudFront reads it as a private origin.
2. **CloudFront distribution**
   - Origin: the S3 bucket, using **Origin Access Control (OAC)** so the bucket stays
     private and only this distribution can read it.
   - Default root object: `index.html`.
   - Custom error responses: `403` and `404` → `/index.html`, HTTP 200 (needed once
     client-side routing is added — see the note below on PR preview paths).
   - Optional: ACM certificate (must be issued in `us-east-1`) + Route 53 record for a
     custom domain.
3. **IAM role for GitHub Actions OIDC** — trust policy scoped to this repo, e.g.:
   ```json
   {
     "Effect": "Allow",
     "Principal": { "Federated": "arn:aws:iam::<account-id>:oidc-provider/token.actions.githubusercontent.com" },
     "Action": "sts:AssumeRoleWithWebIdentity",
     "Condition": {
       "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
       "StringLike": { "token.actions.githubusercontent.com:sub": "repo:<org>/super-web:*" }
     }
   }
   ```
   Permissions policy: `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` on the bucket,
   and `cloudfront:CreateInvalidation` on the distribution.

## Required GitHub repo config

**Variables** (Settings → Secrets and variables → Actions → Variables):

| Name | Example | Used by |
|---|---|---|
| `AWS_REGION` | `us-east-1` | all three workflows |
| `S3_BUCKET_NAME` | `super-web-static` | all three |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E1A2B3C4D5` | all three |
| `CLOUDFRONT_DOMAIN` | `d111111abcdef8.cloudfront.net` | `pr-release.yml` (preview link in PR comment) |

**Secrets:**

| Name | Value | Used by |
|---|---|---|
| `AWS_DEPLOY_ROLE_ARN` | ARN of the IAM role from step 3 above | all three |

## PR preview paths and SPA routing

Each PR deploys under `pr/<number>/` in the same bucket (e.g.
`https://<cloudfront-domain>/pr/42/index.html`), reusing the production distribution
instead of provisioning per-PR infrastructure. `output.publicPath: 'auto'` in
[packages/shell/webpack.config.js](../packages/shell/webpack.config.js) means the built
JS/CSS resolve correctly regardless of which prefix they're served from.

The distribution-level `404 → /index.html` error response above only covers the
production path. If/when client-side routing (e.g. `react-router`) is added, deep links
into a PR preview (`/pr/42/some-route`) would need a CloudFront Function on
viewer-request to rewrite unmatched paths to `/pr/<number>/index.html` instead of the
root one — not needed yet since the shell only does in-memory route switching today, but
worth revisiting before adding a router with real URLs.
