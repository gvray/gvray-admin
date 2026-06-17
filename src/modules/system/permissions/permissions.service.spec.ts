import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('PermissionsService - Scan Managed Permissions', () => {
  let service: PermissionsService;
  let prisma: PrismaService;

  const mockPermission = {
    id: 1,
    permissionId: 'permission-id',
    name: '获取用户列表',
    code: 'system:user:list',
    action: 'list',
    httpMethod: 'GET',
    origin: 'SYSTEM',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdById: null,
    updatedById: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: PrismaService,
          useValue: {
            permission: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('rejects updates for non-scan permissions', async () => {
    jest.spyOn(prisma.permission, 'findUnique').mockResolvedValueOnce({
      ...mockPermission,
      origin: 'USER',
    } as any);

    await expect(
      service.update('permission-id', {
        name: '新名称',
      }),
    ).rejects.toThrow('权限必须由扫描同步生成，不允许手动修改');
  });

  it('allows updating name and description for scan-managed permissions', async () => {
    jest
      .spyOn(prisma.permission, 'findUnique')
      .mockResolvedValueOnce(mockPermission as any);
    jest.spyOn(prisma.permission, 'update').mockResolvedValueOnce({
      ...mockPermission,
      name: '用户列表查询',
      description: '获取用户列表数据',
    } as any);

    const result = await service.update(
      'permission-id',
      {
        name: '用户列表查询',
        description: '获取用户列表数据',
      },
      'operator-id',
    );

    expect(result).toBeDefined();
    expect(prisma.permission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: '用户列表查询',
          description: '获取用户列表数据',
          updatedById: 'operator-id',
        }),
      }),
    );
  });
});
