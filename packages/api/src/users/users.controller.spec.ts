import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { WalletOwnerGuard } from '../auth/wallet-owner.guard';
import { AuthService } from '../auth/auth.service';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {},
        },
        {
          provide: JwtAuthGuard,
          useClass: JwtAuthGuard,
        },
        {
          provide: WalletOwnerGuard,
          useClass: WalletOwnerGuard,
        },
        {
          provide: AuthService,
          useValue: {
            verifySessionToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
