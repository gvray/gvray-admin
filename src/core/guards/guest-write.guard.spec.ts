import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GuestWriteGuard } from './guest-write.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GUEST_ROLE_KEY } from '../../shared/constants/role.constant';
import { IUser } from '../interfaces/user.interface';

class TestGuestWriteGuard extends GuestWriteGuard {
  constructor(
    reflector: Reflector,
    private readonly authenticatedUser?: IUser,
  ) {
    super(reflector);
  }

  protected authenticateRequest(): Promise<IUser | undefined> {
    return Promise.resolve(this.authenticatedUser);
  }
}

const createUser = (roleKey: string): IUser => ({
  userId: `${roleKey}-user-id`,
  email: `${roleKey}@example.com`,
  username: roleKey,
  nickname: roleKey,
  avatar: null,
  status: 1,
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

const createContext = (
  method: string,
  user?: IUser,
  authorization?: string,
): ExecutionContext => {
  const request = {
    method,
    headers: authorization ? { authorization } : {},
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
  guards = [JwtAuthGuard],
}: {
  allowGuestWrite?: boolean;
  guards?: unknown[];
} = {}): Reflector =>
  ({
    getAllAndOverride: jest.fn(() => allowGuestWrite),
    getAllAndMerge: jest.fn(() => guards),
  }) as unknown as Reflector;

describe('GuestWriteGuard', () => {
  const guestUser = createUser(GUEST_ROLE_KEY);
  const adminUser = createUser('admin');

  it('should block guest write requests when request.user already exists', async () => {
    const guard = new TestGuestWriteGuard(createReflector());
    const context = createContext('POST', guestUser);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('should lazily authenticate bearer tokens before blocking guest writes', async () => {
    const guard = new TestGuestWriteGuard(createReflector(), guestUser);
    const context = createContext('PATCH', undefined, 'Bearer guest-token');

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('should allow guest read requests', async () => {
    const guard = new TestGuestWriteGuard(createReflector());
    const context = createContext('GET', guestUser);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should allow non-guest write requests', async () => {
    const guard = new TestGuestWriteGuard(createReflector());
    const context = createContext('DELETE', adminUser);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should let later auth guards handle requests without an authenticated user', async () => {
    const guard = new TestGuestWriteGuard(createReflector());
    const context = createContext('PUT');

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should allow guest writes on endpoints marked with AllowGuestWrite', async () => {
    const guard = new TestGuestWriteGuard(
      createReflector({ allowGuestWrite: true }),
    );
    const context = createContext('POST', guestUser);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should not lazily authenticate public write endpoints', async () => {
    const guard = new TestGuestWriteGuard(
      createReflector({ guards: [] }),
      guestUser,
    );
    const context = createContext('POST', undefined, 'Bearer guest-token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
