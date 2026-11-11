import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { RateLimit } from '../../common/security/rate-limit.decorator.js';
import {
  loginExample,
  passwordRecoveryAcceptedExample,
  passwordRecoveryRequestExample,
  passwordRecoveryResetExample,
  passwordRecoveryVerifyExample,
  passwordRecoveryVerifyResponseExample,
  safeUserExample,
  updateSessionTenantExample,
} from '../../common/swagger/examples.js';
import { AccessTokenGuard } from './access-token.guard.js';
import { AuthService } from './auth.service.js';
import { PasswordRecoveryAcceptedDto } from './dto/password-recovery-accepted.dto.js';
import { PasswordRecoveryResetDto } from './dto/password-recovery-reset.dto.js';
import { PasswordRecoveryRequestDto } from './dto/password-recovery-request.dto.js';
import { PasswordRecoveryValidDto } from './dto/password-recovery-valid.dto.js';
import { PasswordRecoveryVerifyDto } from './dto/password-recovery-verify.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { LoginSessionResponseDto } from './dto/login-session-response.dto.js';
import { MfaCancelDto } from './dto/mfa-cancel.dto.js';
import { MfaChallengeResponseDto } from './dto/mfa-challenge-response.dto.js';
import { MfaResendDto } from './dto/mfa-resend.dto.js';
import { MfaVerifyDto } from './dto/mfa-verify.dto.js';
import { SafeUserDto } from './dto/safe-user.dto.js';
import { UpdateSessionTenantDto } from './dto/update-session-tenant.dto.js';
import { AdministradorGuard } from './guards/administrador.guard.js';
import type { AuthenticatedRequest } from './auth.types.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiExtraModels(MfaChallengeResponseDto, LoginSessionResponseDto)
  @ApiOperation({
    summary:
      'Check the password and continue with the home tenant MFA setting',
  })
  @ApiBody({ type: LoginDto, examples: { mock: { value: loginExample } } })
  @ApiOkResponse({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(MfaChallengeResponseDto) },
        { $ref: getSchemaPath(LoginSessionResponseDto) },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({
    status: 401,
    description:
      'Invalid credentials, or the password matches more than one active account',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({
    status: 503,
    description: 'Digit count is not configured, or email delivery failed',
  })
  @RateLimit({
    identifier: 'ip-and-body',
    key: 'auth-login',
    maxEnvironmentVariable: 'AUTH_LOGIN_RATE_LIMIT_MAX',
    windowEnvironmentVariable: 'AUTH_LOGIN_RATE_LIMIT_WINDOW',
  })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(dto, response, request);
  }

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept the emailed MFA code and start the session' })
  @ApiBody({ type: MfaVerifyDto })
  @ApiOkResponse({
    content: { 'application/json': { example: safeUserExample } },
    type: SafeUserDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid or expired code' })
  @ApiResponse({ status: 403, description: 'Account blocked' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @RateLimit({
    identifier: 'ip-and-body',
    key: 'auth-mfa-verify',
    maxEnvironmentVariable: 'AUTH_LOGIN_RATE_LIMIT_MAX',
    windowEnvironmentVariable: 'AUTH_LOGIN_RATE_LIMIT_WINDOW',
  })
  async verifyMfa(
    @Body() dto: MfaVerifyDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.verifyMfa(dto, response, request);
  }

  @Post('mfa/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Email a new MFA code after the current one expires' })
  @ApiBody({ type: MfaResendDto })
  @ApiOkResponse({ type: MfaChallengeResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid or expired code' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({
    status: 503,
    description: 'Digit count is not configured, or email delivery failed',
  })
  @RateLimit({
    identifier: 'ip-and-body',
    key: 'auth-mfa-resend',
    maxEnvironmentVariable: 'AUTH_LOGIN_RATE_LIMIT_MAX',
    windowEnvironmentVariable: 'AUTH_LOGIN_RATE_LIMIT_WINDOW',
  })
  async resendMfa(@Body() dto: MfaResendDto) {
    return this.authService.resendMfa(dto);
  }

  @Post('mfa/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete the emailed MFA challenge' })
  @ApiBody({ type: MfaCancelDto })
  @ApiNoContentResponse()
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @RateLimit({
    identifier: 'ip-and-body',
    key: 'auth-mfa-cancel',
    maxEnvironmentVariable: 'AUTH_LOGIN_RATE_LIMIT_MAX',
    windowEnvironmentVariable: 'AUTH_LOGIN_RATE_LIMIT_WINDOW',
  })
  async cancelMfa(@Body() dto: MfaCancelDto): Promise<void> {
    await this.authService.cancelMfa(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh-cookie')
  @ApiOperation({ summary: 'Rotate the refresh session' })
  @ApiOkResponse({
    content: { 'application/json': { example: safeUserExample } },
    type: SafeUserDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid session' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @RateLimit({
    identifier: 'ip',
    key: 'auth-refresh',
    maxEnvironmentVariable: 'AUTH_REFRESH_RATE_LIMIT_MAX',
    windowEnvironmentVariable: 'AUTH_REFRESH_RATE_LIMIT_WINDOW',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.refresh(request, response);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth('access-cookie')
  @ApiOperation({ summary: 'Revoke the current session' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UseGuards(AccessTokenGuard)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(request.user, response);
  }

  @Get('session')
  @ApiCookieAuth('access-cookie')
  @ApiOperation({ summary: 'Return the authenticated user' })
  @ApiOkResponse({
    content: { 'application/json': { example: safeUserExample } },
    type: SafeUserDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid session' })
  @UseGuards(AccessTokenGuard)
  async session(@Req() request: AuthenticatedRequest) {
    return this.authService.getSession(
      request.user.id,
      request.user.tenantId,
    );
  }

  @Patch('session')
  @UseGuards(AccessTokenGuard, AdministradorGuard)
  @ApiCookieAuth('access-cookie')
  @ApiOperation({ summary: 'Set the working session tenant for Administrador' })
  @ApiBody({
    examples: { mock: { value: updateSessionTenantExample } },
    type: UpdateSessionTenantDto,
  })
  @ApiOkResponse({
    content: { 'application/json': { example: safeUserExample } },
    type: SafeUserDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid session' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async updateSession(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateSessionTenantDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.updateSessionTenant(request.user, dto, response);
  }

  @Post('password-recovery/request')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request a password recovery email' })
  @ApiBody({
    type: PasswordRecoveryRequestDto,
    examples: { mock: { value: passwordRecoveryRequestExample } },
  })
  @ApiResponse({
    content: {
      'application/json': { example: passwordRecoveryAcceptedExample },
    },
    status: 202,
    type: PasswordRecoveryAcceptedDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @RateLimit({
    identifier: 'ip-and-body',
    key: 'password-recovery-request',
    maxEnvironmentVariable: 'PASSWORD_RESET_RATE_LIMIT_MAX',
    windowEnvironmentVariable: 'PASSWORD_RESET_RATE_LIMIT_WINDOW',
  })
  async requestPasswordRecovery(@Body() dto: PasswordRecoveryRequestDto) {
    await this.authService.requestPasswordRecovery(dto);
    return { message: 'Se a conta existir, enviaremos instruções por e-mail.' };
  }

  @Post('password-recovery/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a password recovery token' })
  @ApiBody({
    type: PasswordRecoveryVerifyDto,
    examples: { mock: { value: passwordRecoveryVerifyExample } },
  })
  @ApiOkResponse({
    content: {
      'application/json': { example: passwordRecoveryVerifyResponseExample },
    },
    type: PasswordRecoveryValidDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired recovery token',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @RateLimit({
    identifier: 'ip-and-body',
    key: 'password-recovery-verify',
    maxEnvironmentVariable: 'PASSWORD_RESET_VERIFY_RATE_LIMIT_MAX',
    windowEnvironmentVariable: 'PASSWORD_RESET_VERIFY_RATE_LIMIT_WINDOW',
  })
  async verifyPasswordRecovery(@Body() dto: PasswordRecoveryVerifyDto) {
    return this.authService.verifyPasswordRecovery(dto);
  }

  @Post('password-recovery/reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset the password with a valid token' })
  @ApiBody({
    type: PasswordRecoveryResetDto,
    examples: { mock: { value: passwordRecoveryResetExample } },
  })
  @ApiNoContentResponse()
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired recovery token',
  })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @RateLimit({
    identifier: 'ip-and-body',
    key: 'password-recovery-reset',
    maxEnvironmentVariable: 'PASSWORD_RESET_VERIFY_RATE_LIMIT_MAX',
    windowEnvironmentVariable: 'PASSWORD_RESET_VERIFY_RATE_LIMIT_WINDOW',
  })
  async resetPassword(@Body() dto: PasswordRecoveryResetDto): Promise<void> {
    await this.authService.resetPassword(dto);
  }
}
