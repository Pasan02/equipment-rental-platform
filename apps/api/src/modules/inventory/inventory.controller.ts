import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { ReceiveInventoryDto } from './dto/receive-inventory.dto';
import { ReleaseInventoryDto } from './dto/release-inventory.dto';
import { DamageInventoryDto } from './dto/damage-inventory.dto';
import { MaintenanceInventoryDto } from './dto/maintenance-inventory.dto';
import { QueryInventoryLogsDto } from './dto/query-inventory-logs.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Roles(UserRole.WAREHOUSE, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get stock overview for all equipment' })
  @ApiResponse({ status: 200, description: 'Inventory stock overview retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden access' })
  async getStockOverview() {
    return this.inventoryService.getStockOverview();
  }

  @Get(':equipmentId/history')
  @Roles(UserRole.WAREHOUSE, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get inventory log history for target equipment' })
  @ApiResponse({ status: 200, description: 'Inventory history logs retrieved' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async getHistory(
    @Param('equipmentId', ParseUUIDPipe) equipmentId: string,
    @Query() query: QueryInventoryLogsDto,
  ) {
    return this.inventoryService.getHistory(equipmentId, query);
  }

  @Post('receive')
  @Roles(UserRole.WAREHOUSE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Record equipment received (increases stock and available quantity)' })
  @ApiResponse({ status: 201, description: 'Equipment received logged successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async receive(
    @Body() dto: ReceiveInventoryDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.receive(dto, user.id);
  }

  @Post('release')
  @Roles(UserRole.WAREHOUSE, UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Record equipment released (decreases available quantity)' })
  @ApiResponse({ status: 201, description: 'Equipment release logged successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient available quantity' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async release(
    @Body() dto: ReleaseInventoryDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.release(dto, user.id);
  }

  @Post('damage')
  @Roles(UserRole.WAREHOUSE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Record equipment damage (decreases total stock & available quantity)' })
  @ApiResponse({ status: 201, description: 'Equipment damage logged successfully' })
  @ApiResponse({ status: 400, description: 'Damage quantity exceeds total stock' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async damage(
    @Body() dto: DamageInventoryDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.damage(dto, user.id);
  }

  @Post('maintenance')
  @Roles(UserRole.WAREHOUSE, UserRole.ADMIN)
  @ApiOperation({ summary: 'Record equipment sent to maintenance' })
  @ApiResponse({ status: 201, description: 'Equipment maintenance logged successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient available stock for maintenance' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async maintenance(
    @Body() dto: MaintenanceInventoryDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.maintenance(dto, user.id);
  }
}
