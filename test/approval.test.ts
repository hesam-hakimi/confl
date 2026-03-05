import { describe, expect, it, vi } from 'vitest';
import { ApprovalService } from '../src/approvals';

vi.mock('vscode', () => ({
  window: {
    showWarningMessage: vi.fn(async () => 'Always allow for workspace'),
  },
}));

describe('approval state logic', () => {
  it('persists always allow', async () => {
    const state = new Map<string, boolean>();
    const memento: any = {
      get: (k: string) => state.get(k),
      update: async (k: string, v: boolean) => state.set(k, v),
    };
    const service = new ApprovalService(memento);
    expect(await service.shouldAllow('search', true)).toBe(true);
    expect(state.get('confluence.approval.always.search')).toBe(true);
    expect(await service.shouldAllow('search', true)).toBe(true);
  });
});
