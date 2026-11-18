import { BadRequestException } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';

export type ListQuery = Record<string, string | undefined>;
export async function paginatedList<T extends ObjectLiteral>(repository: Repository<T>, query: ListQuery,
    fields: string[], relations: string[] = [], scope?: { clearance?: number; patientId?: string }) {
    const integer = (value: string | undefined, fallback: number, max: number) => {
        if (value === undefined) return fallback;
        if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > max) throw new BadRequestException('Invalid pagination parameter');
        return Number(value);
    };
    const page = integer(query.page, 1, 1000000), limit = integer(query.limit, 20, 100);
    const qb = repository.createQueryBuilder('row').where('row.deletedAt IS NULL');
    for (const relation of relations) qb.leftJoinAndSelect(`row.${relation}`, relation);
    const search = query.search?.trim().slice(0, 200);
    if (search) qb.andWhere(`concat_ws(' ', ${fields.map(field => `CAST(row.${field} AS text)`).join(', ')}) ILIKE :search`, { search: `%${search}%` });
    if (scope?.clearance !== undefined) qb.andWhere('row.clearanceRequired <= :clearance', { clearance: scope.clearance });
    if (scope?.patientId) qb.andWhere('row.patientId = :patientId', { patientId: scope.patientId });
    for (const field of ['status', 'severity', 'type', 'role']) {
        if (query[field] && query[field] !== 'all' && repository.metadata.findColumnWithPropertyName(field)) qb.andWhere(`row.${field} = :${field}`, { [field]: query[field] });
    }
    const sort = [...fields, 'createdAt', 'updatedAt'].includes(query.sort || '') ? query.sort! : 'createdAt';
    qb.orderBy(`row.${sort}`, query.direction === 'asc' ? 'ASC' : 'DESC').addOrderBy('row.id', 'ASC');
    const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items, total, page, limit };
}
