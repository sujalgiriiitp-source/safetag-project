# AWS deployment prerequisites and release checklist

Status: preparation only. No deployment, commit, push, AWS credentials inspection, AWS account connection, resource creation or live provider messages are authorized or performed.

## Proposed topology, not provisioned infrastructure

Use one Next.js application service and one notification/retention worker, with MongoDB as the durable source of custody, sessions and outbox state. A proposed AWS deployment is ECS/Fargate web and worker tasks, ECR images and an HTTPS Application Load Balancer. Continue MongoDB Atlas rather than silently substituting DocumentDB. Cloudinary authenticated media is optional only after provider access/expiry tests; private Mongo-backed images are the locally tested adapter.

## Account and network prerequisites

- Obtain explicit deployment approval, region/data-residency decision, monthly budget, billing alerts and a separate staging account/project.
- Build and test an immutable, non-root Linux container. Ensure the worker includes its TypeScript runtime or compile the worker before packaging. The macOS local node_modules symlink is not a deployable artifact.
- Use distinct least-privilege execution/task roles. Inject MongoDB, session/token, Twilio and optional media secrets through Secrets Manager, never image layers or NEXT_PUBLIC variables. Restart tasks after secret changes: [ECS secret injection](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-envvar-secrets-manager.html).
- Use private application subnets, controlled provider egress, restricted security groups, and explicit Atlas IP/private-network access. Never expose MongoDB publicly: [Atlas access lists](https://www.mongodb.com/docs/atlas/security/ip-access-list/).
- Provision DNS and an ACM certificate for the chosen app domain, HTTPS listener, health target and HTTP-to-HTTPS redirect. Configure NEXT_PUBLIC_APP_URL to the canonical HTTPS origin: [ALB HTTPS requirements](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/create-https-listener.html).
- Disable response caching for authenticated APIs, private media and receipts at every proxy/CDN. Do not log request bodies, cookies, receipt secrets or signed media URLs.
- Set log retention, restricted access, error/latency alarms, worker backlog alarms, opt-out/failed-send visibility and an incident owner. Masking is defense-in-depth, not permission to log secrets: [CloudWatch data protection](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/mask-sensitive-log-data.html).

## Application and provider prerequisites

- DEMO_MODE=false; no development seeding or synthetic venue claims. Review public copy, legacy pages and contact/legal details before launch.
- Create production Pilot indexes only after the migration and restore rehearsal. Validate unique active-rack allocation against the actual cluster.
- Configure platform phone allowlist, independent TOTP secret, recovery procedure and Twilio Verify. Local tests verify TOTP/revocation; they do not prove live SMS delivery.
- The current platform TOTP setting is a single shared configuration. Limit the controlled pilot to one platform administrator; per-person enrollment and recovery are required before multi-admin production operation.
- Keep NOTIFICATIONS_ENABLED=false until production WhatsApp sender/templates and opt-in evidence are approved. Configure exact canonical signed status/incoming callback URLs. Test delivered/read/failed/out-of-order states with explicitly authorized recipients.
- Run a durable worker continuously or a secured scheduled job. Bound worker concurrency and alert on expired leases. Uncertain provider acceptance must be reconciled manually, never blindly resent.
- Validate Cloudinary original/derived-image privacy and actual download-link expiry before selecting that storage adapter. Legacy public URLs require a separate migration/revocation audit.
- Keep Google Vision optional and manual confirmation authoritative. Budget/time-limit provider calls and verify failure behavior in staging.
- Establish retention, deletion requests, incident evidence holds, data-processing agreements and venue liability terms with appropriate professional review.

## Production-readiness checklist

- [ ] All local gates pass on the final source and locked dependencies; retain the report and source hash.
- [ ] Linux/container CI and private HTTPS staging reproduce the same gates.
- [ ] Live OTP, approved WhatsApp templates/callbacks and opt-outs pass an authorized drill.
- [ ] Selected media adapter privacy/expiry/deletion is independently verified.
- [ ] Backup restoration, app/worker restart, rollback and secret rotation are rehearsed.
- [ ] Actual 58mm/80mm printers, coupon scanning, phone-dead/lost-slip cases and network-outage SOP pass venue UAT.
- [ ] Multi-operator load, capacity limits, storage growth and reconciliation are tested at expected peak throughput.
- [ ] Manager/admin recovery and support escalation have named owners.
- [ ] Legacy public evidence links, incomplete marketing claims and seed/demo data have been reviewed.
- [ ] Privacy/terms, venue agreement, incident policy and operational sign-off are approved.
- [ ] Explicit production deployment approval is recorded.

Passing local automated tests is not production approval. Items above remain deployment blockers until evidenced.
