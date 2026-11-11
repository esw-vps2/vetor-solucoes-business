import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  StreamableFile,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RateLimit } from '../../common/security/rate-limit.decorator.js';
import {
  createUserExample,
  userListItemExample,
} from '../../common/swagger/examples.js';
import { AccessTokenGuard } from './access-token.guard.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { PasswordResetLinkDto } from './dto/password-reset-link.dto.js';
import { EditUserDto } from './dto/edit-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserListItemDto } from './dto/user-list-item.dto.js';
import { AdministradorGuard } from './guards/administrador.guard.js';
import { AdministradorOrCreateUserGuard } from './guards/administrador-or-create-user.guard.js';
import { SelfOrAdministradorGuard } from './guards/self-or-administrador.guard.js';
import { UsersListGuard } from './guards/users-list.guard.js';
import { MulterExceptionFilter } from './multer-exception.filter.js';
import { photoUploadOptions } from './photo-upload.js';
import { UsersService } from './users.service.js';
import type { AuthenticatedRequest } from './auth.types.js';

@ApiTags('users')
@Controller('users')
@UseGuards(AccessTokenGuard)
@ApiCookieAuth('access-cookie')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(UsersListGuard)
  @ApiOperation({
    summary: 'List users for edit, Perfil, and assignee pickers',
  })
  @ApiOkResponse({
    content: {
      'application/json': { example: [userListItemExample] },
    },
    type: UserListItemDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async list(@Req() request: AuthenticatedRequest): Promise<UserListItemDto[]> {
    return this.usersService.listForActor(request.user.id);
  }

  @Get(':id/photo')
  @UseGuards(SelfOrAdministradorGuard)
  @Header('Cache-Control', 'private, no-store')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Read an uploaded user photo' })
  @ApiResponse({ status: 200, description: 'Image bytes' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async photo(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<StreamableFile> {
    const photo = await this.usersService.readPhoto(id);
    return new StreamableFile(photo.bytes, { type: photo.contentType });
  }

  @Get(':id')
  @UseGuards(SelfOrAdministradorGuard)
  @ApiOperation({ summary: 'Load a user for edit' })
  @ApiOkResponse({ type: EditUserDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<EditUserDto> {
    return this.usersService.findPublicProfile(id);
  }

  @Post(':id/reactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Set a blocked user back to active' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 400, description: 'User is not blocked' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async reactivate(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.usersService.reactivate(id, request.user.id);
  }

  @Post(':id/password-reset-link')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Email a 30-minute password-change link to an active user',
  })
  @ApiNoContentResponse()
  @ApiResponse({ status: 400, description: 'User is not active' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 503, description: 'Email delivery failed' })
  @RateLimit({
    identifier: 'ip',
    key: 'user-password-reset-link',
    maxEnvironmentVariable: 'PASSWORD_RESET_RATE_LIMIT_MAX',
    windowEnvironmentVariable: 'PASSWORD_RESET_RATE_LIMIT_WINDOW',
  })
  async sendPasswordResetLink(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() _body: PasswordResetLinkDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.usersService.sendPasswordResetLink(id, request.user.id);
  }

  @Post()
  @UseGuards(AdministradorOrCreateUserGuard)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('photo', photoUploadOptions))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Register a portal user for a tenant' })
  @ApiBody({
    examples: { mock: { value: createUserExample } },
    type: CreateUserDto,
  })
  @ApiNoContentResponse()
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @RateLimit({
    identifier: 'ip',
    key: 'user-create',
    maxEnvironmentVariable: 'USER_CREATE_RATE_LIMIT_MAX',
    windowEnvironmentVariable: 'USER_CREATE_RATE_LIMIT_WINDOW',
  })
  async create(
    @Body() dto: CreateUserDto,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<void> {
    await this.usersService.create(dto, photo, request.user.id);
  }

  @Delete(':id')
  @UseGuards(AdministradorGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a portal user' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.usersService.delete(id, request.user.id);
  }

  @Patch(':id')
  @UseGuards(SelfOrAdministradorGuard)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('photo', photoUploadOptions))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a portal user' })
  @ApiBody({ type: UpdateUserDto })
  @ApiNoContentResponse()
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<void> {
    await this.usersService.update(id, dto, photo, request.user.id);
  }
}
