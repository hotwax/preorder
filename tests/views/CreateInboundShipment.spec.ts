import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { IonButton } from '@ionic/vue';

const mocks = vi.hoisted(() => ({ enter: [] as (() => Promise<void>)[], fetch: vi.fn() }));
vi.mock('@ionic/vue', async original => ({ ...await original<any>(), onIonViewWillEnter: (fn: () => Promise<void>) => mocks.enter.push(fn) }));
vi.mock('@common', () => ({ translate: (key: string) => key }));
vi.mock('@common/db', () => ({ useSeedData: () => ({ facilityName: (id: string) => id }) }));
vi.mock('vue-router', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('@/store/user', () => ({ useUserStore: () => ({ hasPermission: () => true }) }));
vi.mock('@/composables/usePurchaseOrderActions', () => ({ usePurchaseOrderActions: () => ({ fetchPurchaseOrder: mocks.fetch }) }));
vi.mock('@/composables/useInboundShipments', () => ({ useInboundShipments: () => ({ createShipment: vi.fn() }) }));
vi.mock('@/components/common/ProductItem.vue', () => ({ default: { template: '<div />' } }));
vi.mock('@/components/common/DateFilterSelect.vue', () => ({ default: { template: '<div />' } }));
import CreateInboundShipment from '@/views/CreateInboundShipment.vue';

enableAutoUnmount(afterEach);
beforeEach(() => { mocks.enter = []; mocks.fetch.mockReset(); });
const order = (availability: any) => ({ orderId: '173855', orderName: 'PO248634', items: [
  { orderItemSeqId: '01', productId: '593697', statusId: 'ITEM_APPROVED', quantity: 1, unshippedQuantity: availability },
] });
async function open() {
  const wrapper = mount(CreateInboundShipment, { props: { orderId: '173855' }, global: { provide: { navManager: {} } } });
  await mocks.enter[0]();
  await flushPromises();
  return wrapper;
}

it.each([undefined, null, 'invalid', -1])('does not describe unknown/invalid availability as already shipped: %s', async availability => {
  mocks.fetch.mockResolvedValue(order(availability));
  const wrapper = await open();
  expect(wrapper.text()).toContain('Shipment availability could not be loaded.');
  expect(wrapper.text()).not.toContain('All open units already belong to a shipment.');
  expect(wrapper.findAll('.shipment-line')).toHaveLength(0);
});

it('shows the already assigned state only for known zero availability', async () => {
  mocks.fetch.mockResolvedValue(order(0));
  const wrapper = await open();
  expect(wrapper.text()).toContain('All open units already belong to a shipment.');
  expect(wrapper.text()).not.toContain('Shipment availability could not be loaded.');
});

it('retries missing availability and shows the actual positive quantity when the read recovers', async () => {
  mocks.fetch.mockResolvedValueOnce(order(undefined)).mockResolvedValueOnce(order(1));
  const wrapper = await open();
  const retry = wrapper.findAllComponents(IonButton).find(button => button.text().toLowerCase() === 'retry');
  expect(retry).toBeDefined();
  await retry!.trigger('click');
  await flushPromises();
  expect(mocks.fetch).toHaveBeenCalledTimes(2);
  expect(wrapper.text()).not.toContain('Shipment availability could not be loaded.');
  expect(wrapper.findAll('.shipment-line')).toHaveLength(1);
});
