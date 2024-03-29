import { Injectable } from '@nestjs/common';

import { GetPageAndUserOptions } from '@/src/vice_bank/types';
import { PurchasePrice } from '@/src/models/vice_bank/purchase_price';

@Injectable()
export abstract class PurchasePricesService {
  abstract getPurchasePrices(
    input: GetPageAndUserOptions,
  ): Promise<PurchasePrice[]>;
  abstract addPurchasePrice(
    purchasePrice: PurchasePrice,
  ): Promise<PurchasePrice>;
  abstract updatePurchasePrice(
    purchasePrice: PurchasePrice,
  ): Promise<PurchasePrice>;
  abstract deletePurchasePrice(purchasePriceId: string): Promise<PurchasePrice>;
}
