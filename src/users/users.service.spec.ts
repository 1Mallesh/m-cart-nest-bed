import { ConflictException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { UsersService } from './users.service';
import { UserDocument } from './schemas/user.schema';
import { Role } from '../common/enums/role.enum';

const exec = (val: unknown) => ({ exec: jest.fn().mockResolvedValue(val) });

describe('UsersService', () => {
  let service: UsersService;
  let model: jest.Mocked<Model<UserDocument>>;

  beforeEach(() => {
    model = {
      findById: jest.fn(),
      exists: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
    } as unknown as jest.Mocked<Model<UserDocument>>;
    service = new UsersService(model);
  });

  describe('updateProfile', () => {
    it('updates name and resets verified flag on email change', async () => {
      const user: any = {
        email: 'old@test.com',
        emailVerified: true,
        save: jest.fn().mockResolvedValue(undefined),
      };
      model.findById.mockReturnValue(exec(user) as never);
      model.exists.mockResolvedValue(null as never);

      await service.updateProfile('u1', {
        name: 'New Name',
        email: 'New@Test.com',
      });

      expect(user.name).toBe('New Name');
      expect(user.email).toBe('new@test.com');
      expect(user.emailVerified).toBe(false);
      expect(user.save).toHaveBeenCalled();
    });

    it('throws Conflict when email already used', async () => {
      const user: any = { email: 'old@test.com', save: jest.fn() };
      model.findById.mockReturnValue(exec(user) as never);
      model.exists.mockResolvedValue({ _id: 'other' } as never);

      await expect(
        service.updateProfile('u1', { email: 'taken@test.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFound when user missing', async () => {
      model.findById.mockReturnValue(exec(null) as never);
      await expect(
        service.updateProfile('ghost', { name: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('builds a search + role filter and paginates', async () => {
      const chain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ name: 'Asha' }]),
      };
      model.find.mockReturnValue(chain as never);
      model.countDocuments.mockReturnValue(exec(1) as never);

      const res = await service.list({
        page: 2,
        limit: 10,
        role: Role.VENDOR,
        search: 'asha',
      });

      expect(model.find).toHaveBeenCalledWith(
        expect.objectContaining({ roles: Role.VENDOR }),
      );
      expect(chain.skip).toHaveBeenCalledWith(10);
      expect(chain.limit).toHaveBeenCalledWith(10);
      expect(res).toEqual({
        data: [{ name: 'Asha' }],
        total: 1,
        page: 2,
        limit: 10,
      });
    });
  });

  describe('setRoles', () => {
    it('replaces roles', async () => {
      const user: any = { roles: [Role.CUSTOMER], save: jest.fn() };
      model.findById.mockReturnValue(exec(user) as never);
      await service.setRoles('u1', [Role.ADMIN]);
      expect(user.roles).toEqual([Role.ADMIN]);
    });

    it('rejects empty roles', async () => {
      await expect(service.setRoles('u1', [])).rejects.toThrow();
    });
  });
});
