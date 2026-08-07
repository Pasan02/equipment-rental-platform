import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserRole } from '@equipment-rental/shared-types';
import { EquipmentService } from './equipment.service';
import { QueryEquipmentDto } from './dto/query-equipment.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { Public, Roles, CurrentUser } from '../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';

@ApiTags('equipment')
@Controller('equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'List equipment with search, filters, and pagination (Public)',
  })
  @ApiResponse({ status: 200, description: 'Paginated equipment list.' })
  async findAll(
    @Query() query: QueryEquipmentDto,
    @CurrentUser() user?: { role: UserRole },
  ) {
    return this.equipmentService.findAll(query, user?.role);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get equipment details by ID (Public)' })
  @ApiParam({ name: 'id', description: 'Equipment UUID' })
  @ApiResponse({ status: 200, description: 'Equipment details.' })
  @ApiResponse({ status: 404, description: 'Equipment not found.' })
  async findOne(@Param('id') id: string) {
    return this.equipmentService.findOne(id);
  }

  @Public()
  @Get(':id/availability')
  @ApiOperation({
    summary: 'Check equipment availability for date range (Public)',
  })
  @ApiParam({ name: 'id', description: 'Equipment UUID' })
  @ApiResponse({
    status: 200,
    description: 'Availability calculation results.',
  })
  @ApiResponse({ status: 400, description: 'Invalid date parameters.' })
  @ApiResponse({ status: 404, description: 'Equipment not found.' })
  async checkAvailability(
    @Param('id') id: string,
    @Query() query: CheckAvailabilityDto,
  ) {
    return this.equipmentService.checkAvailability(id, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new equipment (Admin / Staff)' })
  @ApiResponse({ status: 201, description: 'Equipment created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Admin/Staff required).',
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async create(
    @Body() createEquipmentDto: CreateEquipmentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.equipmentService.create(createEquipmentDto, user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update equipment details (Admin / Staff)' })
  @ApiParam({ name: 'id', description: 'Equipment UUID' })
  @ApiResponse({ status: 200, description: 'Equipment updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Admin/Staff required).',
  })
  @ApiResponse({ status: 404, description: 'Equipment or Category not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.equipmentService.update(id, updateEquipmentDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete / deactivate equipment (Admin only)' })
  @ApiParam({ name: 'id', description: 'Equipment UUID' })
  @ApiResponse({
    status: 200,
    description: 'Equipment deactivated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot deactivate equipment with active reservations.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  @ApiResponse({ status: 404, description: 'Equipment not found.' })
  async remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.equipmentService.remove(id, user.id);
  }
}
