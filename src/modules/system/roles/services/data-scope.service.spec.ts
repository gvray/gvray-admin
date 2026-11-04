import { DataScopeService, DataScope } from './data-scope.service';
import { PrismaService } from '@/prisma/prisma.service';

const USER_ID = 'u1';

describe('DataScopeService - buildDataScopeQuery', () => {
  let service: DataScopeService;
  let prisma: {
    userRole: { findMany: jest.Mock };
    user: { findUnique: jest.Mock };
    department: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      userRole: { findMany: jest.fn() },
      user: { findUnique: jest.fn() },
      department: { findMany: jest.fn() },
    };
    service = new DataScopeService(prisma as unknown as PrismaService);
  });

  const setRoleScope = (dataScope: number, deptIds: string[] = []) => {
    prisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          dataScope,
          roleDepartments: deptIds.map((id) => ({ departmentId: id })),
        },
      },
    ]);
  };

  it('ALL 返回空条件（无限制）', async () => {
    setRoleScope(DataScope.ALL);
    const q = await service.buildDataScopeQuery(USER_ID);
    expect(q).toEqual({});
  });

  it('SELF 仅返回本人条件', async () => {
    setRoleScope(DataScope.SELF);
    const q = await service.buildDataScopeQuery(USER_ID);
    expect(q).toEqual({ userId: USER_ID });
  });

  it('DEPARTMENT 仅返回本部门', async () => {
    setRoleScope(DataScope.DEPARTMENT);
    prisma.user.findUnique.mockResolvedValue({ departmentId: 'd1' });
    const q = await service.buildDataScopeQuery(USER_ID);
    expect(q).toEqual({ departmentId: 'd1' });
  });

  it('DEPARTMENT 无部门时退化为本人', async () => {
    setRoleScope(DataScope.DEPARTMENT);
    prisma.user.findUnique.mockResolvedValue({ departmentId: null });
    const q = await service.buildDataScopeQuery(USER_ID);
    expect(q).toEqual({ userId: USER_ID });
  });

  it('DEPARTMENT_AND_CHILD 返回本部门及子部门集合', async () => {
    setRoleScope(DataScope.DEPARTMENT_AND_CHILD);
    prisma.user.findUnique.mockResolvedValue({ departmentId: 'd1' });
    // d1 → [d2]，d2 → []
    prisma.department.findMany.mockImplementation((args: { where: { parentId: string } }) =>
      args.where.parentId === 'd1' ? Promise.resolve([{ departmentId: 'd2' }]) : Promise.resolve([]),
    );
    const q = await service.buildDataScopeQuery(USER_ID);
    expect(q).toEqual({ departmentId: { in: ['d1', 'd2'] } });
  });

  it('CUSTOM 返回指定部门集合', async () => {
    setRoleScope(DataScope.CUSTOM, ['d9', 'd10']);
    const q = await service.buildDataScopeQuery(USER_ID);
    expect(q).toEqual({ departmentId: { in: ['d9', 'd10'] } });
  });

  it('CUSTOM 无部门时退化为本人', async () => {
    setRoleScope(DataScope.CUSTOM, []);
    const q = await service.buildDataScopeQuery(USER_ID);
    expect(q).toEqual({ userId: USER_ID });
  });
});
