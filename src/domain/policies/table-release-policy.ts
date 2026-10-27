import type { TableStatusValue } from '../value-objects/table/table-status.js';

interface TableReleaseState {
  status: TableStatusValue;
  hasActiveOrders: boolean;
  openSessionId: string | null;
}

type TableReleaseDecision =
  | { allowed: true; sessionId: string }
  | { allowed: false; code: 'UNAVAILABLE' | 'IN_USE'; message: string };

export class TableReleasePolicy {
  public static evaluate(state: TableReleaseState): TableReleaseDecision {
    if (state.status === 'FREE') {
      return { allowed: false, code: 'UNAVAILABLE', message: 'A mesa já está livre.' };
    }
    if (state.hasActiveOrders) {
      return { allowed: false, code: 'IN_USE', message: 'A mesa possui pedidos em andamento.' };
    }
    if (state.openSessionId === null) {
      return { allowed: false, code: 'IN_USE', message: 'A mesa ocupada não possui uma comanda aberta.' };
    }
    return { allowed: true, sessionId: state.openSessionId };
  }
}
