import { Test, TestingModule } from '@nestjs/testing';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { File } from 'src/generated/prisma/client';

describe('StorageController', () => {
  let controller: StorageController;
  let storageService: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: StorageService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StorageController>(StorageController);
    storageService = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should return id and url only despite getting full metadata from service', async () => {
      // Arrange: Mock the full metadata returned by the service
      const fullMetadata: File = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        key: '1732367890123-test-file.pdf',
        name: 'test-file.pdf',
        size: 102400,
        mime_type: 'application/pdf',
        bucket: 'my-test-bucket',
        url: 'https://my-test-bucket.s3.amazonaws.com/1732367890123-test-file.pdf',
        created_at: new Date('2025-11-23T10:00:00.000Z'),
        deleted_at: null,
      };

      const uploadFileSpy = jest
        .spyOn(storageService, 'uploadFile')
        .mockResolvedValue(fullMetadata);

      const mockFile = {
        fieldname: 'file',
        originalname: 'test-file.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test content'),
        size: 102400,
      } as Express.Multer.File;

      // Act: Call the controller method
      const result = await controller.uploadFile(mockFile);

      // Assert: Verify only id and url are returned
      expect(result).toEqual({
        id: fullMetadata.id,
        url: fullMetadata.url,
      });

      // Assert: Verify other fields are not present
      expect(result).not.toHaveProperty('key');
      expect(result).not.toHaveProperty('name');
      expect(result).not.toHaveProperty('size');
      expect(result).not.toHaveProperty('mime_type');
      expect(result).not.toHaveProperty('bucket');
      expect(result).not.toHaveProperty('created_at');
      expect(result).not.toHaveProperty('updated_at');
      expect(result).not.toHaveProperty('deleted_at');

      // Assert: Verify the service was called
      expect(uploadFileSpy).toHaveBeenCalledWith(mockFile);
    });
  });
});
