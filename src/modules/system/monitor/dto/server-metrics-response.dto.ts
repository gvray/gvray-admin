import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OsInfoDto {
  @ApiProperty({ description: '操作系统平台' })
  @Expose()
  platform: string;

  @ApiProperty({ description: '主机名' })
  @Expose()
  hostname: string;

  @ApiProperty({ description: '系统运行时间（秒）', type: 'integer' })
  @Expose()
  uptime: number;

  @ApiProperty({ description: '操作系统发行版' })
  @Expose()
  release: string;

  @ApiProperty({ description: 'CPU 架构' })
  @Expose()
  arch: string;

  @ApiProperty({ description: 'Node.js 版本' })
  @Expose()
  nodeVersion: string;

  @ApiProperty({ description: '运行环境' })
  @Expose()
  env: string;
}

export class CpuMetricsDto {
  @ApiProperty({ description: 'CPU 使用率（%）', type: 'number' })
  @Expose()
  usagePercent: number;

  @ApiProperty({ description: '1 分钟负载', type: 'number' })
  @Expose()
  loadAverage1m: number;

  @ApiProperty({ description: '5 分钟负载', type: 'number' })
  @Expose()
  loadAverage5m: number;

  @ApiProperty({ description: '15 分钟负载', type: 'number' })
  @Expose()
  loadAverage15m: number;

  @ApiProperty({ description: '逻辑核心数', type: 'integer' })
  @Expose()
  cores: number;

  @ApiProperty({ description: '物理核心数', type: 'integer' })
  @Expose()
  physicalCores: number;

  @ApiProperty({ description: '每核心使用率（%）', type: [Number] })
  @Expose()
  perCoreUsage: number[];
}

export class MemoryMetricsDto {
  @ApiProperty({ description: '总内存（字节）', type: 'integer' })
  @Expose()
  total: number;

  @ApiProperty({ description: '已用内存（字节）', type: 'integer' })
  @Expose()
  used: number;

  @ApiProperty({ description: '空闲内存（字节）', type: 'integer' })
  @Expose()
  free: number;

  @ApiProperty({ description: '内存使用率（%）', type: 'number' })
  @Expose()
  usagePercent: number;
}

export class DiskMountDto {
  @ApiProperty({ description: '挂载点' })
  @Expose()
  mount: string;

  @ApiProperty({ description: '文件系统类型' })
  @Expose()
  fsType: string;

  @ApiProperty({ description: '总容量（字节）', type: 'integer' })
  @Expose()
  total: number;

  @ApiProperty({ description: '已用容量（字节）', type: 'integer' })
  @Expose()
  used: number;

  @ApiProperty({ description: '空闲容量（字节）', type: 'integer' })
  @Expose()
  free: number;

  @ApiProperty({ description: '使用率（%）', type: 'number' })
  @Expose()
  usagePercent: number;
}

export class NetworkInterfaceDto {
  @ApiProperty({ description: '接口名称' })
  @Expose()
  iface: string;

  @ApiProperty({ description: 'IPv4 地址' })
  @Expose()
  ip4: string;

  @ApiProperty({ description: 'MAC 地址' })
  @Expose()
  mac: string;

  @ApiProperty({ description: '运行状态' })
  @Expose()
  operstate: string;

  @ApiProperty({ description: '接收字节数', type: 'integer' })
  @Expose()
  rxBytes: number;

  @ApiProperty({ description: '发送字节数', type: 'integer' })
  @Expose()
  txBytes: number;
}

export class ProcessMetricsDto {
  @ApiProperty({ description: '进程 ID', type: 'integer' })
  @Expose()
  pid: number;

  @ApiProperty({ description: '进程运行时间（秒）', type: 'integer' })
  @Expose()
  uptime: number;

  @ApiProperty({ description: 'RSS 内存（字节）', type: 'integer' })
  @Expose()
  rss: number;

  @ApiProperty({ description: '堆内存总量（字节）', type: 'integer' })
  @Expose()
  heapTotal: number;

  @ApiProperty({ description: '已用堆内存（字节）', type: 'integer' })
  @Expose()
  heapUsed: number;

  @ApiProperty({ description: '外部内存（字节）', type: 'integer' })
  @Expose()
  external: number;

  @ApiProperty({ description: '进程 CPU 使用率（%）', type: 'number' })
  @Expose()
  cpuPercent: number;

  @ApiProperty({ description: 'Node.js 版本' })
  @Expose()
  nodeVersion: string;
}

export class ServerMetricsResponseDto {
  @ApiProperty({ description: '数据采集时间戳' })
  @Expose()
  timestamp: string;

  @ApiProperty({ description: '操作系统信息', type: OsInfoDto })
  @Expose()
  os: OsInfoDto;

  @ApiProperty({ description: 'CPU 指标', type: CpuMetricsDto })
  @Expose()
  cpu: CpuMetricsDto;

  @ApiProperty({ description: '内存指标', type: MemoryMetricsDto })
  @Expose()
  memory: MemoryMetricsDto;

  @ApiProperty({ description: '磁盘指标', type: [DiskMountDto] })
  @Expose()
  disk: DiskMountDto[];

  @ApiProperty({ description: '网络接口指标', type: [NetworkInterfaceDto] })
  @Expose()
  network: NetworkInterfaceDto[];

  @ApiProperty({ description: '当前进程指标', type: ProcessMetricsDto })
  @Expose()
  process: ProcessMetricsDto;
}
