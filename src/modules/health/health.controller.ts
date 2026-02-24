import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/**
 * Health check controller with Kubernetes-compatible probe endpoints.
 *
 * - `/health/live` — Liveness probe: confirms the process is running.
 * - `/health/ready` — Readiness probe: confirms the app can serve traffic.
 * - `/health` — General health check (combines both).
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'General health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /** Kubernetes liveness probe — is the process alive? */
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Process is alive' })
  live() {
    return { status: 'ok' };
  }

  /** Kubernetes readiness probe — can the app accept traffic? */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is ready to accept traffic' })
  ready() {
    return { status: 'ok' };
  }
}
