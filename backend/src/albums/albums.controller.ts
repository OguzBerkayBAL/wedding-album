import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { Album } from './schemas/album.schema';

@Controller('albums')
export class AlbumsController {
    constructor(private readonly albumsService: AlbumsService) { }

    @Post()
    async create(@Body() createAlbumDto: CreateAlbumDto): Promise<Album> {
        return this.albumsService.create(createAlbumDto);
    }

    @Get()
    async findAll(): Promise<Album[]> {
        return this.albumsService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<Album> {
        return this.albumsService.findOne(id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateAlbumDto: UpdateAlbumDto,
    ): Promise<Album> {
        return this.albumsService.update(id, updateAlbumDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.albumsService.remove(id);
    }
} 