import { ApiProperty } from '@nestjs/swagger';

export class FinanceProjectDocumentDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  projectId: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  contentType: string;

  @ApiProperty()
  byteSize: number;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}
