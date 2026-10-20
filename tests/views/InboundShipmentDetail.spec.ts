import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { IonButton, IonInput } from '@ionic/vue';

const mocks = vi.hoisted(() => ({ enter: [] as (() => Promise<void>)[], fetch: vi.fn(), receive: vi.fn(), canUpdate: true }));
vi.mock('@ionic/vue', async (original) => ({ ...await original<any>(), onIonViewWillEnter: (fn: () => Promise<void>) => mocks.enter.push(fn) }));
vi.mock('@common', () => ({ StatCard: { template: '<div />' }, translate: (key: string) => key, commonUtil: { showToast: vi.fn(), getStatusColor: () => "primary" } }));
vi.mock('@common/db', () => ({ useSeedData: () => ({ facilityName: (id: string) => id, statusDescription: (id: string) => id }) }));
vi.mock('@/store/user', () => ({ useUserStore: () => ({ hasPermission: () => mocks.canUpdate }) }));
vi.mock('@/composables/useProductIdentity', () => ({ useProductIdentity: () => ({ primaryIdentifier: (id: string) => id }) }));
vi.mock('@/components/common/ProductItem.vue', () => ({ default: { template: '<div />' } }));
vi.mock('@/composables/useInboundShipments', () => ({ useInboundShipments: () => ({ fetchShipment: mocks.fetch, receiveShipment: mocks.receive }) }));
import InboundShipmentDetail from '@/views/InboundShipmentDetail.vue';

enableAutoUnmount(afterEach);
const shipment = (receivedQuantity = 0) => ({ shipmentId: 'S1', statusId: 'SHIPMENT_SHIPPED', quantityTotal: 10,
  items: [{ shipmentItemSeqId: '01', productId: 'P1', quantity: 10, receivedQuantity }], receipts: [] });
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
};

describe('receiving an inbound shipment', () => {
  beforeEach(() => { mocks.enter = []; mocks.fetch.mockReset(); mocks.receive.mockReset(); mocks.canUpdate = true; });
  async function open() {
    mocks.fetch.mockResolvedValueOnce(shipment());
    const wrapper = mount(InboundShipmentDetail, { props: { shipmentId: 'S1' }, global: { provide: { navManager: {} } } });
    await mocks.enter[0]();
    await flushPromises();
    wrapper.findAllComponents(IonInput)[0].vm.$emit('update:modelValue', 1);
    await flushPromises();
    return wrapper;
  }

  it('keeps a partial receipt locked until refreshed quantities arrive', async () => {
    const wrapper = await open();
    const refresh = deferred<any>();
    mocks.receive.mockResolvedValue({ fullyReceived: false });
    mocks.fetch.mockReturnValueOnce(refresh.promise);
    const button = wrapper.findComponent(IonButton);
    await button.trigger('click');
    await flushPromises();
    expect(button.props('disabled')).toBe(true);
    // Even another queued click cannot submit the old delta while the GET is pending.
    await button.trigger('click');
    await flushPromises();
    expect(mocks.receive).toHaveBeenCalledTimes(1);
    refresh.resolve(shipment(1));
    await flushPromises();
    expect(wrapper.findAllComponents(IonInput)[0].props('modelValue')).toBe(9);
    expect(button.props('disabled')).toBe(false);
  });

  it('requires a fresh successful read after a receipt, even when refresh fails', async () => {
    const wrapper = await open();
    mocks.receive.mockResolvedValue({ fullyReceived: false });
    mocks.fetch.mockRejectedValueOnce(new Error('Refresh unavailable'));
    await wrapper.findComponent(IonButton).trigger('click');
    await flushPromises();
    expect(mocks.receive).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('Refresh unavailable');
    expect(wrapper.findAllComponents(IonInput)).toHaveLength(0);
    mocks.fetch.mockResolvedValueOnce(shipment(1));
    await wrapper.findComponent(IonButton).trigger('click'); // Retry reads; it never posts another receipt.
    await flushPromises();
    expect(mocks.receive).toHaveBeenCalledTimes(1);
    expect(wrapper.findAllComponents(IonInput)[0].props('modelValue')).toBe(9);
  });
});
