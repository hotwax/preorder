import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { IonItem } from '@ionic/vue';

const mocks = vi.hoisted(() => ({ enter: [] as (() => Promise<void>)[], api: vi.fn(), toast: vi.fn() }));
vi.mock('@ionic/vue', async (original) => ({ ...await original<any>(), onIonViewWillEnter: (fn: () => Promise<void>) => mocks.enter.push(fn) }));
vi.mock('@common', () => ({ api: mocks.api, logger: { error: vi.fn() }, translate: (key: string, params?: Record<string, any>) =>
  key.replace(/\{(\w+)\}/g, (_match, field) => String(params?.[field] ?? `{${field}}`)), StatCard: { template: '<div />' },
  commonUtil: { hasError: () => false, showToast: mocks.toast, getStatusColor: () => "primary" } }));
vi.mock('@common/db', () => ({ useSeedData: () => ({ facilityName: (id: string) => id, statusDescription: (id: string) => id }) }));
vi.mock('@/store/user', () => ({ useUserStore: () => ({ hasPermission: () => true }) }));
vi.mock('@/store/productStore', () => ({ useProductStore: () => ({ getCurrentProductStoreId: 'STORE' }) }));
vi.mock('@/router', () => ({ default: { push: vi.fn() } }));
vi.mock('@/components/common/ProductItem.vue', () => ({ default: { template: '<div />' } }));
vi.mock('@/composables/usePrompts', () => ({ usePrompts: () => ({ promptForDate: async () => '2027-03-01', confirmAction: async () => true }) }));
import PurchaseOrderDetail from '@/views/PurchaseOrderDetail.vue';
import { usePurchaseOrderSearchStore } from '@/store/purchaseOrderSearch';
import { useFutureInventorySearchStore } from '@/store/futureInventorySearch';
import { usePreorderSearchStore } from '@/store/preorderSearch';
import { formatDate } from '@/utils/format';

enableAutoUnmount(afterEach);
beforeEach(() => { setActivePinia(createPinia()); mocks.enter = []; mocks.api.mockReset(); mocks.toast.mockReset(); });

it('shows the committed date and refreshes affected lists when a later line fails', async () => {
  const lines = ['01', '02'].map((orderItemSeqId) => ({ orderItemSeqId, productId: `P${orderItemSeqId}`, statusId: 'ITEM_APPROVED',
    quantity: 5, openQuantity: 5, estimatedDeliveryDate: new Date('2027-02-01').getTime(), futureInventoryItemId: `FI${orderItemSeqId}` }));
  mocks.api.mockImplementation(async ({ url, method, data }: any) => {
    if (method === 'put') {
      if (url.endsWith('/02')) throw new Error('Line 02 is locked');
      lines[0].estimatedDeliveryDate = data.estimatedDeliveryDate;
      return { data: {} };
    }
    if (url === 'oms/purchaseOrders/PO1') return { data: { order: { orderId: 'PO1', statusId: 'ORDER_APPROVED', items: structuredClone(lines) } } };
    if (url === 'oms/futureInventoryItems') return { data: lines.map((line) => ({ poItemSeqId: line.orderItemSeqId, futureInventoryItemId: line.futureInventoryItemId, reservedQuantity: 1, availableToPromiseTotal: 4 })) };
    if (url === 'poorti/purchaseShipments') return { data: { shipments: [] } };
    if (url.endsWith('/receipts')) return { data: [] };
    throw new Error(`Unexpected request ${url}`);
  });
  const wrapper = mount(PurchaseOrderDetail, { props: { orderId: 'PO1' }, global: { provide: { navManager: {} }, stubs: { IonPopover: { template: '<div><slot /></div>' } } } });
  await mocks.enter[0]();
  await flushPromises();
  const action = wrapper.findAllComponents(IonItem).find((item) => item.text() === 'Change arrival date');
  expect(action).toBeDefined();
  await action!.trigger('click');
  await flushPromises();
  expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining('moved on 1 of 2 lines'));
  expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining('Line 02 is locked'));
  expect(wrapper.text()).toContain(formatDate(lines[0].estimatedDeliveryDate));
  expect(mocks.api.mock.calls.filter(([request]) => request.url === 'oms/purchaseOrders/PO1')).toHaveLength(2);
  expect([usePurchaseOrderSearchStore(), useFutureInventorySearchStore(), usePreorderSearchStore()].every((store) => store.stale)).toBe(true);
});
