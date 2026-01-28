import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return this.toResponse(user);
  }

  async updateMe(userId: number, dto: UpdateUserDto) {
    const data: any = {};
    if (dto.full_name !== undefined) data.full_name = dto.full_name;
    if (dto.password !== undefined) {
      data.hashed_password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.toResponse(user);
  }

  private toResponse(user: any) {
    if (!user) return null;
    const { hashed_password, ...rest } = user;
    return rest;
  }
}
