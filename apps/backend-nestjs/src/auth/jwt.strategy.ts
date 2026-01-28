import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-key-not-for-production',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req) as string;
    const blacklisted = await this.prisma.tokenBlacklist.findUnique({
      where: { token },
    });
    if (blacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(payload.sub) },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.is_active) {
      throw new UnauthorizedException('User account is disabled');
    }

    return user;
  }
}
