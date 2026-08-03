import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { EquipmentModule } from '../equipment/equipment.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [PrismaModule, EquipmentModule, ActivityLogsModule],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
