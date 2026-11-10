# Deployment — Lambda + CloudFront via OpenNext

`super-web` is a Next.js app. It's built with [`@opennextjs/aws`](https://opennext.js.org/aws),
which converts the Next.js SSR output into a set of AWS Lambda functions plus a static-asset
bundle, instead of a plain static export. This replaced the earlier static
S3+CloudFront-only plan (see [ARCHITECTURE.md](../../docs/ARCHITECTURE.md#deployment)).

## What `open-next build` produces

Running `npm run opennext:build` (`open-next build`) writes `.open-next/`:

| Path | What it is | Where it goes |
|---|---|---|
| `.open-next/assets` | Static files (`_next/static`, `public/`, `BUILD_ID`) | S3 bucket root |
| `.open-next/cache` | Pre-rendered pages used to seed the ISR cache | S3 bucket, `_cache/` prefix |
| `.open-next/server-functions/default` | The Next.js server (SSR/RSC) | Lambda: `SERVER_FUNCTION_NAME` |
| `.open-next/image-optimization-function` | `next/image` optimization | Lambda: `IMAGE_FUNCTION_NAME` |
| `.open-next/revalidation-function` | Consumes the ISR revalidation queue | Lambda: `REVALIDATION_FUNCTION_NAME` |
| `.open-next/warmer-function` | Periodically pings the server function to reduce cold starts | Lambda: `WARMER_FUNCTION_NAME` |
| `.open-next/dynamodb-provider` | One-time DynamoDB tag-cache table seeder | Invoked once manually, not part of CI |

This is OpenNext's standard output shape (confirmed from `.open-next/open-next.output.json`
after a local build) — not something specific to this app. The CI workflows below deploy all
four recurring functions on every release; `dynamodb-provider` is a one-time setup step, run
by hand after the DynamoDB table exists (see below).

> **Windows note:** `open-next build` has a known issue on native Windows — dependency
> installation for `image-optimization-function` fails with an `ENOENT`/`mkdtemp` error
> because of the Windows drive-letter colon in temp paths. It works fine on Linux (including
> the `ubuntu-latest` GitHub Actions runners these workflows use). Use WSL if you need to run
> `open-next build` locally on Windows.

## CI/CD workflows

Four files in [.github/workflows/](../.github/workflows/):

| Workflow | Trigger | Does |
|---|---|---|
| `deploy.yml` | Reusable (`workflow_call`), not triggered directly | Type-check, test, `open-next build`, sync assets to S3, update all 4 Lambda functions, invalidate CloudFront. Parameterized by `environment: preview \| production` (a GitHub Environment — see below). |
| `pr-release.yml` | PR opened/updated against `master` | Calls `deploy.yml` with `environment: preview`, then posts/updates a sticky PR comment with the preview URL |
| `pr-closed.yml` | PR closed | No infra to tear down (see below) — just marks the PR's preview comment stale |
| `master-release.yml` | Push to `master`, or manual dispatch | Calls `deploy.yml` with `environment: production` |

### Why preview is a shared slot, not per-PR

OpenNext's output is 4 Lambda functions + S3 + (at runtime) an SQS queue and a DynamoDB table
for ISR — materially more infrastructure per environment than the old static-site setup.
Spinning up a fully isolated copy of all of that per open PR is a real infra project on its
own (the tool built for exactly this is [SST](https://sst.dev), which wraps OpenNext and
supports per-stage `sst deploy --stage pr-<n>` / `sst remove --stage pr-<n>`).

For now, `pr-release.yml` deploys every PR push to one shared `preview` environment: whichever
PR pushes last "owns" the live preview link until another PR deploys over it. `pr-closed.yml`
has nothing to delete as a result — it just updates the PR's comment to say the shared preview
may no longer reflect that PR. If concurrent, isolated PR environments become worth the cost,
migrating to SST is the natural next step.

## GitHub Environments

Both `preview` and `production` need to exist as
[GitHub Environments](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment)
(Settings → Environments), each with its own AWS resources and its own copy of the
variables/secrets below — `deploy.yml` picks values by resolving `vars.*`/`secrets.*` against
whichever environment name it's called with.

**Variables** (per environment):

| Name | Example (`preview`) | Example (`production`) |
|---|---|---|
| `AWS_REGION` | `ap-southeast-1` | `ap-southeast-1` |
| `S3_BUCKET_NAME` | `super-web-preview-assets` | `super-web-prod-assets` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `E1PREVIEW000` | `E1PROD000000` |
| `CLOUDFRONT_DOMAIN` | `preview.d111.cloudfront.net` | `d222.cloudfront.net` (or a custom domain) |
| `SERVER_FUNCTION_NAME` | `super-web-preview-server` | `super-web-prod-server` |
| `IMAGE_FUNCTION_NAME` | `super-web-preview-image` | `super-web-prod-image` |
| `REVALIDATION_FUNCTION_NAME` | `super-web-preview-revalidation` | `super-web-prod-revalidation` |
| `WARMER_FUNCTION_NAME` | `super-web-preview-warmer` | `super-web-prod-warmer` |

**Secret** (per environment): `AWS_DEPLOY_ROLE_ARN` — the IAM role GitHub Actions assumes via
OIDC for that environment (can be the same role for both if you'd rather not duplicate it,
scoped to both buckets/functions).

## One-time AWS setup (per environment: `preview` and `production`)

1. **S3 bucket** — private. Holds static assets at the root and the ISR cache under `_cache/`.
2. **DynamoDB table** — ISR tag cache (on-demand billing is fine for a portfolio-scale app).
3. **SQS queue** — ISR revalidation queue, consumed by `revalidation-function`.
4. **4 Lambda functions** (`server`, `image-optimization`, `revalidation`, `warmer`) — create
   them once with a placeholder deployment package; CI overwrites the code on every deploy via
   `aws lambda update-function-code`. Each function's *execution role* (not the CI role) needs:
   - `server` / `revalidation`: read/write on the S3 bucket, `sqs:SendMessage` (server, to
     enqueue revalidations) / `sqs:ReceiveMessage`+`DeleteMessage` (revalidation, to consume
     them), read/write on the DynamoDB table.
   - `image-optimization`: read on the S3 bucket.
   - `warmer`: `lambda:InvokeFunction` on the server function.
5. **API Gateway (HTTP API)** in front of `server` and `image-optimization` — OpenNext's Lambda
   handlers are built with the `aws-apigw-v2` converter, so they expect an API Gateway v2
   event shape (a raw Lambda Function URL wouldn't decode requests the same way).
6. **CloudFront distribution** — origins: the S3 bucket (OAC) and the two API Gateway
   endpoints. Behaviors, from `.open-next/open-next.output.json`:
   - `_next/image*` → image-optimization API Gateway origin
   - `_next/data/*`, `*` (default) → server API Gateway origin
   - `BUILD_ID`, `_next/*` → S3 origin
7. **One-time DynamoDB seed**: after the table exists, invoke `dynamodb-provider`'s handler
   once by hand (`aws lambda invoke` against a temporary deploy of
   `.open-next/dynamodb-provider`, or run it locally against the table) — it's an
   initialization step, not something to repeat on every deploy.
8. **IAM role for GitHub Actions OIDC** — trust policy scoped to this repo:
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
   Permissions policy: `s3:PutObject`/`DeleteObject`/`ListBucket` on the bucket,
   `lambda:UpdateFunctionCode`/`PublishVersion` on the 4 functions, and
   `cloudfront:CreateInvalidation` on the distribution.
