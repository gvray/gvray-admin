import { Injectable, Logger } from '@nestjs/common';
import * as si from 'systeminformation';
import * as os from 'os';
import {
  ServerMetricsResponseDto,
  OsInfoDto,
  CpuMetricsDto,
  MemoryMetricsDto,
  DiskMountDto,
  NetworkInterfaceDto,
  ProcessMetricsDto,
} from './dto/server-metrics-response.dto';

@Injectable()
export class MonitorService {
  private readonly logger = new Logger(MonitorService.name);

  async getServerMetrics(): Promise<ServerMetricsResponseDto> {
    const [
      currentLoad,
      mem,
      fsSize,
      networkInterfaces,
      networkStats,
      processLoad,
    ] = await Promise.all([
      si.currentLoad().catch((e) => {
        this.logger.warn(`Failed to get CPU load: ${e.message}`);
        return null;
      }),
      si.mem().catch((e) => {
        this.logger.warn(`Failed to get memory: ${e.message}`);
        return null;
      }),
      si.fsSize().catch((e) => {
        this.logger.warn(`Failed to get disk: ${e.message}`);
        return [];
      }),
      si.networkInterfaces().catch((e) => {
        this.logger.warn(`Failed to get network interfaces: ${e.message}`);
        return [];
      }),
      si.networkStats().catch((e) => {
        this.logger.warn(`Failed to get network stats: ${e.message}`);
        return [];
      }),
      si.processLoad('node').catch((e) => {
        this.logger.warn(`Failed to get process load: ${e.message}`);
        return null;
      }),
    ]);

    const osInfo = this.buildOsInfo();
    const cpu = this.buildCpuMetrics(currentLoad);
    const memory = this.buildMemoryMetrics(mem);
    const disk = this.buildDiskMetrics(fsSize);
    const network = this.buildNetworkMetrics(networkInterfaces, networkStats);
    const processMetrics = this.buildProcessMetrics(
      Array.isArray(processLoad) ? processLoad[0] ?? null : processLoad,
    );

    return {
      timestamp: new Date().toISOString(),
      os: osInfo,
      cpu,
      memory,
      disk,
      network,
      process: processMetrics,
    };
  }

  private buildOsInfo(): OsInfoDto {
    return {
      platform: os.platform(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      release: os.release(),
      arch: os.arch(),
      nodeVersion: process.version,
      env: process.env.NODE_ENV || 'development',
    };
  }

  private buildCpuMetrics(currentLoad: si.Systeminformation.CurrentLoadData | null): CpuMetricsDto {
    if (!currentLoad) {
      return {
        usagePercent: 0,
        loadAverage1m: 0,
        loadAverage5m: 0,
        loadAverage15m: 0,
        cores: os.cpus().length,
        physicalCores: os.cpus().length,
        perCoreUsage: [],
      };
    }

    const loadAvg = os.loadavg();

    return {
      usagePercent: parseFloat(currentLoad.currentLoad.toFixed(2)),
      loadAverage1m: loadAvg[0] ?? 0,
      loadAverage5m: loadAvg[1] ?? 0,
      loadAverage15m: loadAvg[2] ?? 0,
      cores: currentLoad.cpus.length,
      physicalCores: os.cpus().length,
      perCoreUsage: currentLoad.cpus.map((c) => parseFloat(c.load.toFixed(2))),
    };
  }

  private buildMemoryMetrics(mem: si.Systeminformation.MemData | null): MemoryMetricsDto {
    if (!mem) {
      const total = os.totalmem();
      const free = os.freemem();
      return {
        total,
        used: total - free,
        free,
        usagePercent: total > 0 ? parseFloat(((total - free) / total * 100).toFixed(2)) : 0,
      };
    }

    return {
      total: mem.total,
      used: mem.used,
      free: mem.free,
      usagePercent: mem.total > 0 ? parseFloat((mem.used / mem.total * 100).toFixed(2)) : 0,
    };
  }

  private buildDiskMetrics(fsSize: si.Systeminformation.FsSizeData[]): DiskMountDto[] {
    return fsSize.map((fs) => ({
      mount: fs.mount,
      fsType: fs.type,
      total: fs.size,
      used: fs.used,
      free: fs.size - fs.used,
      usagePercent: parseFloat(fs.use.toFixed(2)),
    }));
  }

  private buildNetworkMetrics(
    interfaces: si.Systeminformation.NetworkInterfacesData[],
    stats: si.Systeminformation.NetworkStatsData[],
  ): NetworkInterfaceDto[] {
    const ifaceList = Array.isArray(interfaces) ? interfaces : [];
    const statList = Array.isArray(stats) ? stats : [];

    return ifaceList
      .filter((iface): iface is si.Systeminformation.NetworkInterfacesData & { ip4: string; mac: string } =>
        !!iface && typeof iface.ip4 === 'string' && !!iface.ip4 && !!iface.iface && String(iface.operstate) === 'up',
      )
      .map((iface) => {
        const stat = statList.find((s) => s.iface === iface.iface);
        return {
          iface: iface.iface,
          ip4: iface.ip4,
          mac: iface.mac,
          operstate: 'up',
          rxBytes: stat?.rx_bytes ?? 0,
          txBytes: stat?.tx_bytes ?? 0,
        };
      });
  }

  private buildProcessMetrics(processLoad: si.Systeminformation.ProcessesProcessLoadData | null): ProcessMetricsDto {
    const memUsage = process.memoryUsage();

    return {
      pid: process.pid,
      uptime: Math.floor(process.uptime()),
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      cpuPercent: processLoad ? parseFloat(processLoad.cpu.toFixed(2)) : 0,
      nodeVersion: process.version,
    };
  }
}
