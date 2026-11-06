import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { IonSelect } from '@ionic/vue';
import { ref } from 'vue';

const mocks = vi.hoisted(() => ({ refresh: vi.fn(), enter: [] as (() => Promise<void>)[], rows: [] as any[] }));
vi.mock('@ionic/vue', async original => ({ ...await original<any>(), onIonViewWillEnter: (fn: () => Promise<void>) => mocks.enter.push(fn) }));
vi.mock('@common', () => ({ translate: (key: string) => key, commonUtil: { getStatusColor: () => 'medium' } }));
vi.mock('@common/db', () => ({
  useSeedData: () => ({ statusDescription: (id: string) => id, facilityName: (id: string) => id }),
  useLiveEntity: (table: string) => table === 'shopifyShops'
    ? { records: ref([{ shopId: 'DOLLSKILL', name: 'Dolls Test UAT' }]) }
    : { first: ref({ rows: mocks.rows, fetchedAt: Date.now(), hasMore: false }) },
}));
vi.mock('@/db/preorderDb', () => ({ preorderDb: { tables: { shopifyShops: 'shopifyShops', preorderSyncPages: 'preorderSyncPages' } } }));
vi.mock('@/db/appDbSync', () => ({ refreshAfterMutation: mocks.refresh }));
vi.mock('@/store/productStore', () => ({ useProductStore: () => ({ getCurrentProductStoreId: 'STORE' }) }));
import PreorderSyncEvents from '@/views/PreorderSyncEvents.vue';

enableAutoUnmount(afterEach);
beforeEach(() => { vi.clearAllMocks(); mocks.enter = []; mocks.rows = []; mocks.refresh.mockResolvedValue(1); });
const render = () => mount(PreorderSyncEvents, { global: { provide: { navManager: {} } } });

it('recognizes the released confirmed digest and shows the metafield revision identity', async () => {
  mocks.rows = [{ metafieldId: 'M1', metafieldDetailSeqId: 4, namespace: 'hotwax', metaKey: 'preorder_batches', confirmedDigest: 'confirmed', failed: 'N' }];
  const wrapper = render();
  wrapper.findAllComponents(IonSelect)[1].vm.$emit('update:modelValue', 'metafield');
  await flushPromises();
  expect(wrapper.text()).toContain('Confirmed');
  expect(wrapper.text()).toContain('Revision');
  expect(wrapper.text()).toContain('hotwax.preorder_batches');
});

it('keeps an identity without a Shopify ID pending rather than labelling it published', async () => {
  mocks.rows = [{ metafieldId: 'M1', shopifyMetafieldId: null }];
  const wrapper = render();
  wrapper.findAllComponents(IonSelect)[1].vm.$emit('update:modelValue', 'published');
  await flushPromises();
  expect(wrapper.text()).toContain('Metafield mappings');
  expect(wrapper.find('ion-badge').text()).toBe('Pending');
});

it('does not claim a server change was saved when a monitoring read fails', async () => {
  mocks.refresh.mockRejectedValue(Object.assign(new Error('The server change was saved'), { name: 'CacheReconciliationError', mutationCommitted: true }));
  const wrapper = render();
  await mocks.enter[0]();
  await flushPromises();
  expect(wrapper.text()).toContain('Could not load sync events');
  expect(wrapper.text()).not.toContain('server change was saved');
});
