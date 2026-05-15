# Security Specification for Kanji Master

## 1. Data Invariants
- Users can only read and write their own profile data.
- Game logs are immutable once created.
- `totalCorrect` and `currentStreak` can only be updated by the owner.
- `mascotTier` must correspond to streak or score milestones (though rules can't easily verify complex thresholds without cloud functions, we can enforce strict schema).
- Document IDs for users must match their `request.auth.uid`.

## 2. The Dirty Dozen Payloads (Rejection Targets)
1. **Identity Spoofing**: Attempt to create a user profile with a different UID.
2. **Global Read**: Attempt to list all users.
3. **Log Tampering**: Attempt to update an existing game log.
4. **Log Deletion**: Attempt to delete a game log.
5. **PII Leak**: Attempt to read another user's email if stored.
6. **Negative Stats**: Update `totalCorrect` with a negative number.
7. **Privilege Escalation**: Adding an `isAdmin: true` field.
8. **Resource Poisoning**: Use a 10KB string as a `displayName`.
9. **Orphaned Write**: Create a log for a non-existent user.
10. **Shadow Field**: Add `verified: true` to a profile.
11. **Future Timestamp**: Set `lastActiveDate` to 100 years in the future.
12. **Malformed ID**: Use `../dangerous-path` as a user ID.

## 3. Test Runner (Draft)
This will be implemented in `firestore.rules.test.ts`.
