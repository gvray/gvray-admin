import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GuestWriteGuard } from './guest-write.guard';
import { GUEST_ROLE_KEY } from '../../shared/constants/role.constant';
import { IUser } from '../interfaces/user.interface';

const createUser = (roleKey: string): IUser => ({
  userId: `${roleKey}-user-id`,
  email: `${roleKey}@example.com`,
  username: roleKey,
  nickname: roleKey,
  avatar: null,
  status: 'enabled',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  roles: [
    {
      roleId: `${roleKey}-role-id`,
      name: roleKey,
      roleKey,
      description: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      permissions: [],
    },
  ],
});

const createContext = (method: string, user?: IUser): ExecutionContext => {
  const request = {
    method,
    headers: {},
    user,
  };

  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => request),
    })),
  } as unknown as ExecutionContext;
};

const createReflector = ({
  allowGuestWrite = false,
}: {
  allowGuestWrite?: boolean;
} = {}): Reflector =>
  ({
    getAllAndOverride: jest.fn(() => allowGuestWrite),
  }) as unknown as Reflector;

describe('GuestWriteGuard', () => {
  const guestUser = createUser(GUEST_ROLE_KEY);
  const adminUser = createUser('admin');

  it('should block guest write requests', () => {
    const guard = new GuestWriteGuard(createReflector());
    const context = createContext('POST', guestUser);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow guest read requests', () => {
    const guard = new GuestWriteGuard(createReflector());
    const context = createContext('GET', guestUser);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow non-guest write requests', () => {
    const guard = new GuestWriteGuard(createReflector());
    const context = createContext('DELETE', adminUser);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should let later auth guards handle requests without an authenticated user', () => {
    const guard = new GuestWriteGuard(createReflector());
    const context = createContext('PUT');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow guest writes on endpoints marked with AllowGuestWrite', () => {
    const guard = new GuestWriteGuard(
      createReflector({ allowGuestWrite: true }),
    );
    const context = createContext('POST', guestUser);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should handle user with empty roles array as non-guest (fallback)', () => {
    const guard = new GuestWriteGuard(createReflector());
    const emptyRolesUser = { ...createUser('anyone'), roles: [] };
    const context = createContext('POST', emptyRolesUser);

    expect(guard.canActivate(context)).toBe(true);
  });
});
