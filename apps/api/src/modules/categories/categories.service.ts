import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper utility to convert a category name into a URL-friendly slug.
   */
  public generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Retrieve all categories with count of assigned equipment.
   */
  async findAll() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: { equipment: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Retrieve category by ID or unique slug.
   */
  async findOne(idOrSlug: string) {
    // Check if input is UUID format vs slug string
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const category = await this.prisma.category.findFirst({
      where: isUuid
        ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
        : { slug: idOrSlug },
      include: {
        _count: {
          select: { equipment: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with identifier '${idOrSlug}' not found`,
      );
    }

    return category;
  }

  /**
   * Create a new category with auto-generated slug and uniqueness checks.
   */
  async create(createCategoryDto: CreateCategoryDto) {
    const slug = this.generateSlug(createCategoryDto.name);

    const existing = await this.prisma.category.findFirst({
      where: {
        OR: [{ name: createCategoryDto.name }, { slug }],
      },
    });

    if (existing) {
      throw new ConflictException(
        `Category with name '${createCategoryDto.name}' or slug '${slug}' already exists`,
      );
    }

    return this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        imageUrl: createCategoryDto.imageUrl,
        slug,
      },
      include: {
        _count: {
          select: { equipment: true },
        },
      },
    });
  }

  /**
   * Update an existing category. Updates slug if name is modified.
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id); // Ensures category exists

    const updateData: Record<string, any> = { ...updateCategoryDto };

    if (updateCategoryDto.name) {
      const slug = this.generateSlug(updateCategoryDto.name);
      updateData.slug = slug;

      const conflicting = await this.prisma.category.findFirst({
        where: {
          NOT: { id },
          OR: [{ name: updateCategoryDto.name }, { slug }],
        },
      });

      if (conflicting) {
        throw new ConflictException(
          `Another category with name '${updateCategoryDto.name}' or slug '${slug}' already exists`,
        );
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { equipment: true },
        },
      },
    });
  }

  /**
   * Remove a category if no equipment is assigned to it.
   */
  async remove(id: string) {
    const category = await this.findOne(id);

    if (category._count && category._count.equipment > 0) {
      throw new BadRequestException(
        `Cannot delete category '${category.name}' because it has ${category._count.equipment} associated equipment item(s)`,
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
