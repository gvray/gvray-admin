import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { QueryMenuDto } from './dto/query-menu.dto';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/guards/roles.guard';
import { PermissionsGuard } from '@/core/guards/permissions.guard';
import { RequirePermissions } from '@/core/decorators/permissions.decorator';
import { Audit } from '@/core/decorators/audit.decorator';
import { ResponseUtil } from '@/shared/utils/response.util';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { IUser } from '@/core/interfaces/user.interface';
import { MenuResponseDto, MenuTreeNodeDto } from './dto/menu-response.dto';

@ApiTags('菜单管理')
@Controller('system/menus')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @RequirePermissions('system:menu:create')
  @Audit('create')
  @ApiOperation({ summary: '创建菜单' })
  @ApiResponse({ status: 201, description: '创建成功', type: MenuResponseDto })
  async create(
    @Body() createMenuDto: CreateMenuDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.menuService.create(createMenuDto, user.userId);
    return ResponseUtil.created(data, '创建成功');
  }

  @Get()
  @RequirePermissions('system:menu:list')
  @ApiOperation({ summary: '获取菜单列表' })
  @ApiResponse({ status: 200, description: '菜单列表', type: [MenuResponseDto] })
  async findAll(@Query() query: QueryMenuDto) {
    const pageData = await this.menuService.findAll(query);
    return ResponseUtil.paginated(pageData, '菜单列表');
  }

  @Get('tree')
  @RequirePermissions('system:menu:list')
  @ApiOperation({ summary: '获取菜单树结构' })
  @ApiResponse({ status: 200, description: '菜单树结构', type: [MenuTreeNodeDto] })
  async getTree(@Query() queryDto: QueryMenuDto) {
    const data = await this.menuService.getMenuTree(queryDto);
    return ResponseUtil.found(data, '菜单树结构');
  }

  @Get('parent-list')
  @RequirePermissions('system:menu:list')
  @ApiOperation({ summary: '获取父菜单列表' })
  @ApiResponse({ status: 200, description: '父菜单列表', type: [MenuResponseDto] })
  async getParentList() {
    const data = await this.menuService.getParentList();
    return ResponseUtil.found(data, '父菜单列表');
  }

  @Get(':id')
  @RequirePermissions('system:menu:view')
  @ApiOperation({ summary: '获取指定菜单' })
  @ApiResponse({ status: 200, description: '获取成功', type: MenuResponseDto })
  @ApiResponse({ status: 404, description: '菜单不存在' })
  async findOne(@Param('id') id: string) {
    const data = await this.menuService.findOne(id);
    return ResponseUtil.found(data, '获取成功');
  }

  @Patch(':id')
  @RequirePermissions('system:menu:update')
  @Audit('update')
  @ApiOperation({ summary: '更新菜单' })
  @ApiResponse({ status: 200, description: '更新成功', type: MenuResponseDto })
  @ApiResponse({ status: 404, description: '菜单不存在' })
  async update(
    @Param('id') id: string,
    @Body() updateMenuDto: UpdateMenuDto,
    @CurrentUser() user: IUser,
  ) {
    const data = await this.menuService.update(id, updateMenuDto, user.userId);
    return ResponseUtil.updated(data, '更新成功');
  }

  @Delete(':id')
  @RequirePermissions('system:menu:delete')
  @Audit('delete')
  @ApiOperation({ summary: '删除菜单' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '菜单不存在' })
  async remove(@Param('id') id: string) {
    await this.menuService.remove(id);
    return ResponseUtil.deleted(null, '删除成功');
  }
}
