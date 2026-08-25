import {
  IsEnum,
  IsIP,
  IsMACAddress,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export enum OSPlatform {
  WINDOWS = 'Windows',
  LINUX = 'Linux',
  MACOS = 'MacOS',
}

export class InitMachineDto {
  @IsEnum(OSPlatform)
  @IsNotEmpty()
  os: OSPlatform;

  @IsString()
  @IsNotEmpty()
  os_version: string;

  @IsString()
  @IsNotEmpty()
  device_type: string;

  @IsString()
  @IsNotEmpty()
  hostname: string;

  @IsString()
  @IsNotEmpty()
  machine_id: string;

  @IsIP()
  @IsNotEmpty()
  public_ip: string;

  @IsIP()
  @IsNotEmpty()
  local_ip: string;

  @IsMACAddress()
  @IsNotEmpty()
  mac_address: string;
}
