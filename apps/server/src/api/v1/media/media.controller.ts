import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { MediaService } from './media.service';
import { UploadMediaDto } from '../../../models/group/dto/media/upload-media.dto';
import { MediaResponseDto } from '../../../models/group/dto/media/media-response.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
  };
}

@Controller('groups/:groupId/media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadMediaDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<MediaResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.mediaService.uploadMedia(
      groupId,
      req.user.userId,
      file,
      uploadDto,
    );
  }

  @Get()
  async getGroupMedia(
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Request() req: AuthenticatedRequest,
  ): Promise<{ media: MediaResponseDto[]; total: number; totalPages: number }> {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    return this.mediaService.getGroupMedia(
      groupId,
      req.user.userId,
      pageNum,
      limitNum,
    );
  }

  @Get('count')
  async getGroupMediaCount(
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ): Promise<{ count: number }> {
    const count = await this.mediaService.getGroupMediaCount(groupId);
    return { count };
  }
}

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaItemController {
  constructor(private readonly mediaService: MediaService) {}

  @Get(':mediaId')
  async getMediaById(
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<MediaResponseDto> {
    return this.mediaService.getMediaById(mediaId, req.user.userId);
  }

  @Put(':mediaId/caption')
  async updateMediaCaption(
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @Body('caption') caption: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<MediaResponseDto> {
    if (!caption || caption.trim().length === 0) {
      throw new BadRequestException('Caption cannot be empty');
    }

    if (caption.length > 500) {
      throw new BadRequestException('Caption must be less than 500 characters');
    }

    return this.mediaService.updateMediaCaption(
      mediaId,
      req.user.userId,
      caption.trim(),
    );
  }

  @Delete(':mediaId')
  async deleteMedia(
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    await this.mediaService.deleteMedia(mediaId, req.user.userId);
    return { message: 'Media deleted successfully' };
  }

  @Get(':mediaId/download')
  async getMediaDownloadUrl(
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ downloadUrl: string }> {
    const media = await this.mediaService.getMediaById(
      mediaId,
      req.user.userId,
    );

    // For now, just return the secure URL
    // In a production environment, you might want to generate a signed URL
    return { downloadUrl: media.fileUrl };
  }
}
