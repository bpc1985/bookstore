import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashed_password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        full_name: dto.full_name,
        hashed_password,
        role: 'user',
      },
    });

    return this.toUserResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.hashed_password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.is_active) {
      throw new UnauthorizedException('User account is disabled');
    }

    return this.generateTokens(user.id);
  }

  async refresh(refreshToken: string) {
    const blacklisted = await this.prisma.tokenBlacklist.findUnique({
      where: { token: refreshToken },
    });
    if (blacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(payload.sub) },
    });
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    await this.prisma.tokenBlacklist.create({
      data: { token: refreshToken },
    });

    return this.generateTokens(user.id);
  }

  async logout(accessToken: string, refreshToken?: string) {
    // Use upsert to handle already-blacklisted tokens gracefully
    await this.prisma.tokenBlacklist.upsert({
      where: { token: accessToken },
      update: {},
      create: { token: accessToken },
    });
    if (refreshToken) {
      await this.prisma.tokenBlacklist.upsert({
        where: { token: refreshToken },
        update: {},
        create: { token: refreshToken },
      });
    }
  }

  private generateTokens(userId: number) {
    const accessToken = this.jwtService.sign(
      { sub: String(userId), type: 'access' },
      { expiresIn: `${process.env.ACCESS_TOKEN_EXPIRE_MINUTES || 15}m` },
    );
    const refreshToken = this.jwtService.sign(
      { sub: String(userId), type: 'refresh' },
      { expiresIn: `${process.env.REFRESH_TOKEN_EXPIRE_DAYS || 7}d` },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
    };
  }

  toUserResponse(user: any) {
    const { hashed_password, ...rest } = user;
    return rest;
  }
}
