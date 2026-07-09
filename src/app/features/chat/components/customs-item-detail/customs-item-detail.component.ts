import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomsDeclarationItem } from '@app/core/models/types';

/**
 * Read-only body for a single CustomsDeclarationItem — the full GoodsShipment field set from the
 * real LPI submission JSON. Shared between ocr-results (first OCR read) and form-preview (final
 * review before submit) so both show the exact same structure; each host wraps this in its own
 * modal chrome and may append its own editable fields below it (e.g. form-preview appends
 * Measurement / Meas. Unit, which the schema doesn't capture).
 */
@Component({
  selector: 'app-customs-item-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './customs-item-detail.component.html',
  styleUrl: './customs-item-detail.component.scss',
})
export class CustomsItemDetailComponent {
  @Input({ required: true }) item!: CustomsDeclarationItem;
}
