import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;

  const mockPrismaService = {
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    jest.clearAllMocks();
  });

  describe('generateSlug', () => {
    it('should generate lowercased hyphenated slug', () => {
      expect(service.generateSlug('Camera Gear & Equipment')).toBe(
        'camera-gear-equipment',
      );
      expect(service.generateSlug('  Drones 4K!  ')).toBe('drones-4k');
    });
  });

  describe('findAll', () => {
    it('should return all categories with equipment count', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Camera Gear',
          slug: 'camera-gear',
          _count: { equipment: 5 },
        },
      ];
      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAll();
      expect(result).toEqual(mockCategories);
      expect(mockPrismaService.category.findMany).toHaveBeenCalledWith({
        include: { _count: { select: { equipment: true } } },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return category when found by slug', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Camera Gear',
        slug: 'camera-gear',
        _count: { equipment: 3 },
      };
      mockPrismaService.category.findFirst.mockResolvedValue(mockCategory);

      const result = await service.findOne('camera-gear');
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when category does not exist', async () => {
      mockPrismaService.category.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create category with auto-generated slug', async () => {
      const createDto = {
        name: 'Audio Gear',
        description: 'Microphones and mixers',
      };
      const createdCategory = {
        id: 'cat-2',
        ...createDto,
        slug: 'audio-gear',
        _count: { equipment: 0 },
      };

      mockPrismaService.category.findFirst.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue(createdCategory);

      const result = await service.create(createDto);
      expect(result).toEqual(createdCategory);
      expect(mockPrismaService.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Audio Gear',
          description: 'Microphones and mixers',
          imageUrl: undefined,
          slug: 'audio-gear',
        },
        include: { _count: { select: { equipment: true } } },
      });
    });

    it('should throw ConflictException if category name or slug already exists', async () => {
      const createDto = { name: 'Camera Gear' };
      mockPrismaService.category.findFirst.mockResolvedValue({
        id: 'cat-1',
        name: 'Camera Gear',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update category and regenerate slug if name changes', async () => {
      const updateDto = { name: 'Pro Audio' };
      const existingCategory = {
        id: 'cat-2',
        name: 'Audio Gear',
        slug: 'audio-gear',
        _count: { equipment: 0 },
      };
      const updatedCategory = {
        id: 'cat-2',
        name: 'Pro Audio',
        slug: 'pro-audio',
        _count: { equipment: 0 },
      };

      mockPrismaService.category.findFirst
        .mockResolvedValueOnce(existingCategory) // for findOne check
        .mockResolvedValueOnce(null); // for conflict check
      mockPrismaService.category.update.mockResolvedValue(updatedCategory);

      const result = await service.update('cat-2', updateDto);
      expect(result).toEqual(updatedCategory);
    });
  });

  describe('remove', () => {
    it('should delete category if equipment count is 0', async () => {
      const category = {
        id: 'cat-3',
        name: 'Empty Category',
        slug: 'empty-category',
        _count: { equipment: 0 },
      };
      mockPrismaService.category.findFirst.mockResolvedValue(category);
      mockPrismaService.category.delete.mockResolvedValue(category);

      const result = await service.remove('cat-3');
      expect(result).toEqual(category);
    });

    it('should throw BadRequestException if category has associated equipment', async () => {
      const category = {
        id: 'cat-1',
        name: 'Camera Gear',
        slug: 'camera-gear',
        _count: { equipment: 5 },
      };
      mockPrismaService.category.findFirst.mockResolvedValue(category);

      await expect(service.remove('cat-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
