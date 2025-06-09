export type Unit = 'kg' | 't' | 'lb' | 'oz';

export interface WeightRecord {
  id          : string;
  weight      : number;
  unit        : Unit;
  quantity    : number;
  folio       : string;
  transaction : string;
  product     : string;
  subproduct? : string;
  box         : string;
  caliber     : string;
  origin?     : string;
  process?    : string;
  notes?      : string;
  timestamp   : string;
  synced      : boolean;
  transactionId : string;
  productId     : string;
  subproductId  : string;
  boxId         : string;
  caliberId     : string;
  originId      : string;
  processId     : string;
}
