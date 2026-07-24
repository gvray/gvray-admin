import { PartialType } from '@nestjs/swagger';
import { CreateNoticeDto } from './create-notice.dto';

export class UpdateNoticeDto extends PartialType(CreateNoticeDto) {}
