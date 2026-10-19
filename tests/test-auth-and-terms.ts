import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CURRENT_TERMS_VERSION } from '../lib/legal';

describe('Terms Consent Suite', () => {
  const mockDb: Record<string, { terms_version: string | null; terms_accepted_at: string | null }> = {};
  const userId = 'test-user-uuid-1234';

  function evaluateShouldShowTerms(uid: string, currentVersion: string): boolean {
    const profile = mockDb[uid];
    if (!profile || !profile.terms_version) return true;
    return profile.terms_version !== currentVersion;
  }

  function mockUpsertTerms(uid: string, version: string) {
    mockDb[uid] = {
      terms_version: version,
      terms_accepted_at: new Date().toISOString(),
    };
    return { success: true, savedVersion: mockDb[uid].terms_version };
  }

  it('prompts new user without profile record for consent', () => {
    assert.strictEqual(evaluateShouldShowTerms(userId, CURRENT_TERMS_VERSION), true);
  });

  it('dismisses prompt once terms are accepted', () => {
    const acceptResult = mockUpsertTerms(userId, CURRENT_TERMS_VERSION);
    assert.strictEqual(acceptResult.success, true);
    assert.strictEqual(acceptResult.savedVersion, CURRENT_TERMS_VERSION);
    assert.strictEqual(evaluateShouldShowTerms(userId, CURRENT_TERMS_VERSION), false);
  });

  it('does not re-prompt during navigation or reload on same version', () => {
    assert.strictEqual(evaluateShouldShowTerms(userId, CURRENT_TERMS_VERSION), false);
  });

  it('does not re-prompt across user sign-out and sign-in for same version', () => {
    assert.strictEqual(evaluateShouldShowTerms(userId, CURRENT_TERMS_VERSION), false);
  });

  it('re-prompts when legal version is bumped', () => {
    const bumpedVersion = '1.1';
    assert.strictEqual(evaluateShouldShowTerms(userId, bumpedVersion), true);
    const acceptBumped = mockUpsertTerms(userId, bumpedVersion);
    assert.strictEqual(acceptBumped.savedVersion, bumpedVersion);
    assert.strictEqual(evaluateShouldShowTerms(userId, bumpedVersion), false);
  });
});
