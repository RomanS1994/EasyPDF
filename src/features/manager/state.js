import {
  getStoredManagerOrdersSelectedOnly,
  getStoredManagerSelectedOrderId,
  getStoredManagerSelectedUserId,
  setStoredManagerOrdersSelectedOnly,
  setStoredManagerSelectedOrderId,
  setStoredManagerSelectedUserId,
} from './manager-storage.js';

export const state = {
  managerUsers: [],
  managerPlans: [],
  managerAudit: [],
  managerOrders: [],
  managerOrdersSummary: {
    all: 0,
    pending: 0,
    failed: 0,
    generated: 0,
  },
  managerSelectedUserId: getStoredManagerSelectedUserId(),
  managerSelectedUser: null,
  managerSelectedOrders: [],
  managerSelectedOrderId: getStoredManagerSelectedOrderId(),
  managerSelectedOrder: null,
  managerOrdersSelectedOnly: getStoredManagerOrdersSelectedOnly(),
};

export function clearManagerState() {
  state.managerUsers = [];
  state.managerPlans = [];
  state.managerAudit = [];
  state.managerOrders = [];
  state.managerOrdersSummary = {
    all: 0,
    pending: 0,
    failed: 0,
    generated: 0,
  };
  state.managerSelectedUserId = '';
  state.managerSelectedUser = null;
  state.managerSelectedOrders = [];
  state.managerSelectedOrderId = '';
  state.managerSelectedOrder = null;
  state.managerOrdersSelectedOnly = false;
  setStoredManagerSelectedUserId('');
  setStoredManagerSelectedOrderId('');
  setStoredManagerOrdersSelectedOnly(false);
}
