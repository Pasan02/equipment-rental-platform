import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ActivityAction, UserRole, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new customer user
   */
  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email.toLowerCase(),
        passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone || null,
        role: UserRole.CUSTOMER,
      },
    });

    // Create Activity Log
    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: ActivityAction.REGISTER,
        entityType: 'USER',
        entityId: user.id,
        newValues: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  /**
   * Login user and issue access + refresh tokens
   */
  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user);

    // Create Activity Log
    await this.prisma.activityLog.create({
      data: {
        userId: user.id,
        action: ActivityAction.LOGIN,
        entityType: 'USER',
        entityId: user.id,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  /**
   * Refresh expired access token using token rotation
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenDto.refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (tokenRecord.isRevoked) {
      this.logger.warn(
        `Security Alert: Revoked refresh token reuse attempt detected for user ${tokenRecord.userId}`,
      );
      await this.prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId, isRevoked: false },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException(
        'Refresh token compromise detected. All active sessions have been revoked for security.',
      );
    }

    if (!tokenRecord.user || !tokenRecord.user.isActive) {
      throw new UnauthorizedException('User account is inactive or disabled');
    }

    // Revoke current token (Token Rotation)
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    // Issue new token pair
    const tokens = await this.generateTokens(tokenRecord.user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900,
    };
  }

  /**
   * Request password reset token
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: forgotPasswordDto.email.toLowerCase() },
    });

    if (user && user.isActive) {
      const resetSecret = this.configService.get<string>('jwt.secret') + user.passwordHash;
      const resetToken = this.jwtService.sign(
        { sub: user.id, email: user.email, type: 'password_reset' },
        { secret: resetSecret, expiresIn: '1h' },
      );

      this.logger.log(`Password reset requested for email: ${user.email}`);
      // In production, nodemailer sends an email with the link `https://app/reset-password?token=${resetToken}`
    }

    // Always return success response to prevent email enumeration
    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  /**
   * Reset password using token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    let payload: any;
    try {
      // Decode unverified token to find user ID first
      const decoded: any = this.jwtService.decode(resetPasswordDto.token);
      if (!decoded || !decoded.sub || decoded.type !== 'password_reset') {
        throw new BadRequestException('Invalid or expired password reset token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new BadRequestException('Invalid or expired password reset token');
      }

      const resetSecret = this.configService.get<string>('jwt.secret') + user.passwordHash;
      payload = this.jwtService.verify(resetPasswordDto.token, { secret: resetSecret });
    } catch (error) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { passwordHash },
    });

    // Revoke all active refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: { userId: payload.sub, isRevoked: false },
      data: { isRevoked: true },
    });

    return {
      message: 'Password reset successful',
    };
  }

  /**
   * Logout user by revoking refresh token
   */
  async logout(logoutDto: LogoutDto, userId?: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: logoutDto.refreshToken },
    });

    if (tokenRecord) {
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true },
      });

      if (userId || tokenRecord.userId) {
        await this.prisma.activityLog.create({
          data: {
            userId: userId || tokenRecord.userId,
            action: ActivityAction.LOGOUT,
            entityType: 'USER',
            entityId: userId || tokenRecord.userId,
          },
        });
      }
    }

    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * Helper: Generate Access Token and Refresh Token
   */
  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: (this.configService.get<string>('jwt.accessExpiration') || '15m') as any,
    });

    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const refreshExpiresInDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresInDays);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenString,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenString,
    };
  }
}
