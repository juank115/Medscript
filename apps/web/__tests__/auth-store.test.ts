import { vi, describe, test, expect, beforeEach } from 'vitest';

// Replace persist with a no-op so the store works without localStorage
vi.mock('zustand/middleware', () => ({
  persist: (fn: unknown) => fn,
}));

import { useAuthStore } from '@/store/auth-store';

const mockUser = {
  id: 'user-1',
  email: 'dr@test.com',
  name: 'Dr. Carlos Rodríguez',
  role: 'DOCTOR' as const,
};

beforeEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null });
});

describe('auth-store', () => {
  test('initial state is empty', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  test('setAuth stores user and tokens', () => {
    useAuthStore.getState().setAuth({
      user: mockUser,
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
    });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('access-token-123');
    expect(state.refreshToken).toBe('refresh-token-456');
  });

  test('setAuth replaces existing auth data', () => {
    const anotherUser = { id: 'user-2', email: 'admin@test.com', name: 'Admin', role: 'ADMIN' as const };

    useAuthStore.getState().setAuth({ user: mockUser, accessToken: 'token-a', refreshToken: 'refresh-a' });
    useAuthStore.getState().setAuth({ user: anotherUser, accessToken: 'token-b', refreshToken: 'refresh-b' });

    const state = useAuthStore.getState();
    expect(state.user).toEqual(anotherUser);
    expect(state.accessToken).toBe('token-b');
  });

  test('logout clears all state', () => {
    useAuthStore.getState().setAuth({
      user: mockUser,
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });
});
