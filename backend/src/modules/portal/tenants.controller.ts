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
  Post,
  Put,
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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  tenantCreatedExample,
  tenantListItemExample,
} from '../../common/swagger/examples.js';
import { AccessTokenGuard } from './access-token.guard.js';
import type { AuthenticatedRequest } from './auth.types.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { TenantCreatedDto } from './dto/tenant-created.dto.js';
import { TenantListItemDto } from './dto/tenant-list-item.dto.js';
import { AdministradorGuard } from './guards/administrador.guard.js';
import { AdministradorOrCreateUserGuard } from './guards/administrador-or-create-user.guard.js';
import { MulterExceptionFilter } from './multer-exception.filter.js';
import { photoUploadOptions } from './photo-upload.js';
import { TenantsService } from './tenants.service.js';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(AccessTokenGuard)
@ApiCookieAuth('access-cookie')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @UseGuards(AdministradorOrCreateUserGuard)
  @ApiOperation({
    summary:
      'List every tenant for user registration and Power BI distribution',
  })
  @ApiOkResponse({
    content: {
      'application/json': { example: [tenantListItemExample] },
    },
    type: TenantListItemDto,
    isArray: true,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async list(
    @Req() request: AuthenticatedRequest,
  ): Promise<TenantListItemDto[]> {
    return this.tenantsService.listForActor(request.user.id);
  }

  @Get(':id/photo')
  @Header('Cache-Control', 'private, no-store')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  @Header('X-Content-Type-Options', 'nosniff')
  @ApiOperation({ summary: 'Read the working tenant photo' })
  @ApiResponse({ status: 200, description: 'Image bytes' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async photo(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<StreamableFile> {
    const photo = await this.tenantsService.readPhoto(id, {
      profile: request.user.profile,
      tenantId: request.user.tenantId,
    });
    return new StreamableFile(photo.bytes, { type: photo.contentType });
  }

  @Post()
  @UseGuards(AdministradorGuard)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('photo', photoUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Register a tenant' })
  @ApiBody({ type: CreateTenantDto })
  @ApiCreatedResponse({
    content: {
      'application/json': { example: tenantCreatedExample },
    },
    type: TenantCreatedDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 409, description: 'Tenant already exists' })
  async create(
    @Body() dto: CreateTenantDto,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<TenantCreatedDto> {
    if (photo) {
      return this.tenantsService.create(dto, photo);
    }

    return this.tenantsService.create(dto);
  }

  @Put(':id/photo')
  @UseGuards(AdministradorGuard)
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('photo', photoUploadOptions))
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Replace a tenant photo' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['photo'],
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Required raster image, maximum 5 MB',
        },
      },
    },
  })
  @ApiNoContentResponse()
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async replacePhoto(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @UploadedFile() photo?: Express.Multer.File,
  ): Promise<void> {
    await this.tenantsService.replacePhoto(id, photo);
  }

  @Delete(':id/photo')
  @UseGuards(AdministradorGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a tenant photo' })
  @ApiNoContentResponse()
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async deletePhoto(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.tenantsService.deletePhoto(id);
  }
}
