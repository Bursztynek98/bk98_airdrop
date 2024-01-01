import { TNetAircraft } from './net-aircraft';
import { TNetMetaData } from './net-meta-data';
import { TNetProp } from './net-prop';

export type TNetPayload = {
  id: string;
  aircraft: TNetAircraft;
  prop: TNetProp;
  metaData?: TNetMetaData;
};
