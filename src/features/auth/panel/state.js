import {
  getStoredManagerOrdersSelectedOnly,
  getStoredManagerSelectedOrderId,
  getStoredManagerSelectedUserId,
  setStoredManagerOrdersSelectedOnly,
  setStoredManagerSelectedOrderId,
  setStoredManagerSelectedUserId,
} from './manager-storage.js';
import { getDefaultAuthMode, getRouteTab } from './shell.js';

export const state = {
  plans: [],
  user: null,
  orders: [],
  activeTab: getRouteTab(),
  activeStatsTab: 'usage',
  selectedPlanId: '',
  authMode: getDefaultAuthMode(),
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
  ordersDateFilter: '',
  orderDetailOrderId: '',
};

export let managerSearchTimer = 0;
export let managerOrdersSearchTimer = 0;

export function setManagerSearchTimer(value) {
  managerSearchTimer = value;
}

export function setManagerOrdersSearchTimer(value) {
  managerOrdersSearchTimer = value;
}

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
  state.orderDetailOrderId = '';
  setStoredManagerSelectedUserId('');
  setStoredManagerSelectedOrderId('');
  setStoredManagerOrdersSelectedOnly(false);
}
