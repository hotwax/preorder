import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';

const mocks = vi.hoisted(() => ({ enter: [] as (() => void)[], settings: vi.fn(), counts: vi.fn() }));
vi.mock('@ionic/vue', async original => ({ ...await original<any>(), onIonViewWillEnter: (fn: () => void) => mocks.enter.push(fn) }));
vi.mock('@common', () => ({
  translate: (key: string) => key,
  commonUtil: { showToast: vi.fn(), getStatusColor: () => 'medium' },
  StatCard: { props: ['title', 'stat', 'subtitle'], template: '<div class="stat-card">{{ title }} {{ stat }} {{ subtitle }}</div>' },
}));
vi.mock('@common/db', () => ({ useSeedData: () => ({ enumsByType: () => [], enumDescription: (id: string) => id, statusDescription: (id: string) => id }) }));
vi.mock('@/store/user', () => ({ useUserStore: () => ({ hasPermission: () => true }) }));
vi.mock('@/store/productStore', () => ({ useProductStore: () => ({ getCurrentProductStoreId: 'STORE' }) }));
vi.mock('@/router', () => ({ default: { push: vi.fn() } }));
vi.mock('@/components/communications/EmailSettingModal.vue', () => ({ default: { template: '<div />' } }));
vi.mock('@/components/common/DateFilterSelect.vue', () => ({ default: { template: '<div />' } }));
vi.mock('@/components/common/SearchFilterCard.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/components/common/UniformFilterLayout.vue', () => ({ default: { template: '<div><slot /></div>' } }));
vi.mock('@/composables/useCommunications', () => ({ useCommunications: () => ({
  fetchEmailSettings: mocks.settings, fetchCounts: mocks.counts, fetchEmailGateways: async () => [],
  fetchEvents: async () => ({ rows: [], total: 0 }), setEmailEnabled: vi.fn(), updateEmailSetting: vi.fn(),
}) }));
import Communications from '@/views/Communications.vue';

enableAutoUnmount(afterEach);
beforeEach(() => {
  mocks.enter = []; mocks.settings.mockReset(); mocks.counts.mockReset();
  mocks.settings.mockResolvedValue([{ emailType: 'PREORDER_DATE_CHANGE', wired: true, exists: true, enabled: false, gatewayConfigured: false }]);
  mocks.counts.mockResolvedValue([]);
});
async function open() {
  const wrapper = mount(Communications, { global: { provide: { navManager: {} } } });
  mocks.enter[0]();
  await flushPromises();
  return wrapper;
}

it('retains valid settings when the optional counts endpoint fails, without inventing zero sends', async () => {
  mocks.counts.mockRejectedValue(new Error('HTTP 404'));
  const wrapper = await open();
  expect(wrapper.text()).toContain('PREORDER_DATE_CHANGE');
  expect(wrapper.text()).toContain('Edit email settings');
  expect(wrapper.text()).toContain('Email counts unavailable');
  expect(wrapper.text()).not.toContain('Could not load email settings');
  expect(wrapper.findAll('.stat-card').every(card => card.text().includes('—'))).toBe(true);
});

it('shows genuine zero counts when the count requests succeed with no activity', async () => {
  const wrapper = await open();
  expect(wrapper.findAll('.stat-card')).toHaveLength(2);
  expect(wrapper.findAll('.stat-card').every(card => card.text().includes('0'))).toBe(true);
  expect(wrapper.text()).not.toContain('Email counts unavailable');
});

it('explains an empty email catalog instead of leaving a blank settings section', async () => {
  mocks.settings.mockResolvedValue([]);
  const wrapper = await open();
  expect(wrapper.text()).toContain('No pre-order email settings');
  expect(wrapper.text()).toContain('No pre-order email types are available for this store.');
  expect(wrapper.text()).not.toContain('Edit email settings');
});

it('keeps a genuine settings failure visible', async () => {
  mocks.settings.mockRejectedValue(new Error('Settings read failed'));
  const wrapper = await open();
  expect(wrapper.text()).toContain('Could not load email settings');
  expect(wrapper.text()).toContain('Settings read failed');
});
