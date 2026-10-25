# Controlled pilot cutover and rollback

No production migration, index creation, seeding or data deletion has been performed.

## Before cutover

1. Take an encrypted backup and prove restoration into a separate staging database. Record backup owner, retention, restore time and recovery objectives.
2. Inventory legacy venues, duplicate operator phones, active deposits and any publicly accessible Cloudinary URLs/PDFs. The code does not revoke already-issued provider URLs.
3. Reconcile every legacy physical item with its actual storage location. Do not silently convert old receipt numbers into collection secrets.
4. Review and approve venues in the platform workspace. Configure bins, capacity, hours, fees, accepted/prohibited items and a photo-retention policy.
5. After human review, run `ALLOW_INDEX_CREATION=true npm run pilot:indexes` with the intended staging URI. Inspect the unique request-key, receipt-hash and partial active-location indexes. Do not run `syncIndexes` or drop legacy indexes.
6. Reauthenticate staff. Old stateless cookies intentionally no longer authenticate. New opaque sessions are server-revocable and expire after eight hours.

## Compatibility boundary

Existing Venue, Deposit and Operator fields are retained. New Pilot collections hold custody, operations, assets, sessions, rate limits, grants, invitations, phone bindings, callback evidence and audit records. Legacy authenticated reporting remains accessible; unsafe production check-in/return writes are redirected/rejected in favor of the pilot workflow. Demo remains explicitly local and synthetic.

Staff phone bindings prevent concurrent assignment across venues. Cross-venue transfers require a supervised procedure; do not edit the binding while the old staff account remains active. Invitation consumption is one-time and fail-closed; a database failure after consumption may require a new manager-issued invite.

Active and unresolved-incident evidence is held even beyond the configured retention date. The cleanup worker deletes eligible returned/cancelled evidence in bounded batches. Registered but never accepted records require manager cancellation and reconciliation.

## Rollback

Stop new admissions; inventory all occupied bins and pending payment/notification records. Do not roll back to the old unauthenticated writes or short-token public access. Restore a previously validated secure application image while retaining Pilot collections and indexes. If a full database restore is necessary, reconcile receipts, cash and physical custody created after the backup before permitting new returns.

Keep TOKEN_SECRET stable across replicas. Rotating it changes newly derived view/collection credentials and requires a designed migration/reissue process; do not rotate blindly during an active shift. Session revocation does not require rotating this secret.

## Operator outage drill

Use a numbered paper register with time, receipt, items/condition, physical bin, fee, operator and separate collection coupon. Do not claim an offline digital save. A manager reconciles paper entries against existing request keys before online back-entry. Lost coupons require in-person verification and a documented manager exception. Suspended venues require supervised platform coordination for outstanding returns; never bypass authorization directly in MongoDB.
