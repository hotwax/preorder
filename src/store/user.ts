import { DateTime } from "luxon";
import { defineStore } from "pinia";
import { api, commonUtil, cookieHelper, logger, translate } from "@common";
import { useAuth } from "@common/composables/useAuth";
import { showToast } from "@/utils";
import { setUserZone } from "@/utils/format";
import { useProductStore } from "@/store/productStore";
import { usePreorderSearchStore } from "@/store/preorderSearch";
import { useFutureInventorySearchStore } from "@/store/futureInventorySearch";
import { usePurchaseOrderSearchStore } from "@/store/purchaseOrderSearch";
import { useInboundShipmentSearchStore } from "@/store/inboundShipmentSearch";
import { startAppDbSync, stopAppDbSync } from "@/db/appDbSync";

/**
 * Drops what the last session left in the app's stores: the product store and every list. A logout unmounts
 * nothing, and a session that expires silently lands on /login without a logout, so the next login (the same
 * user or another) would otherwise see the previous session's lists and store.
 */
function resetSessionStores() {
  [useProductStore(), usePreorderSearchStore(), useFutureInventorySearchStore(), usePurchaseOrderSearchStore(), useInboundShipmentSearchStore()]
    .forEach((store) => store.$reset());
}

export const useUserStore = defineStore("user", {
  state: () => ({
    current: {} as any,
    permissions: [] as string[],
    pwaState: {
      updateExists: false,
      registration: null as any,
    },
    timeZones: [] as any[],
    oms: "",
    // The app version this deployment is pinned to. undefined = not resolved yet, "" = no version
    // configured, "vX.Y.Z" = pinned. Resolved from the OMS by useAuth().fetchAppVersion() on Login.
    appVersion: undefined as string | undefined,
    fetchStatus: {
      profile: "none",
      permissions: "none"
    } as any
  }),
  getters: {
    getPermissions: (state) => state.permissions,
    getUserProfile: (state) => state.current,
    getAppVersion: (state) => state.appVersion,
    getPwaState: (state) => state.pwaState,
    getUserTimeZone: (state) => state.current.timeZone,
    getAvailableTimeZones: (state) => state.timeZones,
    getFetchStatus: (state) => state.fetchStatus,
    hasPermission: (state) => (permissionId: string): boolean => {
      if (!permissionId) return true;

      if (permissionId.includes(" OR ")) {
        return permissionId.split(" OR ").some((part) => useUserStore().hasPermission(part.trim()));
      }

      if (permissionId.includes(" AND ")) {
        return permissionId.split(" AND ").every((part) => useUserStore().hasPermission(part.trim()));
      }

      return state.permissions.includes(permissionId);
    }
  },
  actions: {
    async fetchUserProfile() {
      this.fetchStatus.profile = "pending";

      try {
        const userProfileResp = await api({
          url: "admin/user/profile",
          method: "get",
          baseURL: commonUtil.getMaargURL()
        });
        this.current = userProfileResp.data;
        useAuth().updateUserId(this.current.userId);

        setUserZone(this.current.timeZone);
        this.fetchStatus.profile = "success";
      } catch (error: any) {
        await showToast(translate("Failed to fetch user profile information. Please try again."));
        logger.error("Failed to fetch user profile information", error);
        useAuth().clearAuth();
        this.fetchStatus.profile = "error";
        return Promise.reject(error);
      }
    },
    async fetchPermissions() {
      const permissionId = import.meta.env.VITE_APP_PERMISSION_ID
      const serverPermissions = [] as string[]
      const viewSize = 200
      let viewIndex = 0

      this.fetchStatus.permissions = "pending"

      try {
        let resp
        do {
          resp = await api({
            url: "admin/user/permissions",
            method: "get",
            params: { viewIndex, viewSize }
          }) as any

          if (resp.status === 200 && resp.data.docs?.length && !commonUtil.hasError(resp)) {
            serverPermissions.push(...resp.data.docs.map((permission: any) => permission.permissionId))
            viewIndex++
          } else {
            resp = null
          }
        } while (resp)

        if(permissionId) {
          const hasPermission = serverPermissions.includes(permissionId)
          if(!hasPermission) {
            const permissionError = "You do not have permission to access the app."
            await showToast(translate(permissionError))
            logger.error("error", permissionError)
            this.fetchStatus.permissions = "error"
            // The persisted list would otherwise keep granting what was just revoked
            this.permissions = []
            return Promise.reject(new Error(permissionError))
          }
        }

        this.permissions = serverPermissions
        this.fetchStatus.permissions = "success"
      } catch (error: any) {
        this.fetchStatus.permissions = "error"
        return Promise.reject(error)
      }
    },
    
    async setUserTimeZone(tzId: string) {
      if (this.current.timeZone === tzId) return;

      try {
        const resp = await api({
          url: "admin/user/profile",
          method: "POST",
          data: {
            userId: this.current.userId,
            tzId
          },
        }) as any;

        if (resp?.status !== 200) throw resp;

        this.current.timeZone = tzId;
        setUserZone(tzId);
        // The lists' day filters are bounded in the user's time zone: they search again in the new one when next shown
        [usePreorderSearchStore(), useFutureInventorySearchStore(), usePurchaseOrderSearchStore(), useInboundShipmentSearchStore()]
          .forEach((store) => store.markStale());
        await showToast(translate("Time zone updated successfully."));
        return tzId;
      } catch (error) {
        logger.error("Failed to update time zone", error);
        await showToast(translate("Failed to update time zone. Please try again."));
        return Promise.reject(error);
      }
    },
    async fetchAvailableTimeZones() {
      if (this.timeZones.length) return;

      try {
        const resp: any = await api({
          url: "admin/user/getAvailableTimeZones",
          method: "get"
        });

        this.timeZones = resp.data.timeZones.filter((timeZone: any) => DateTime.local().setZone(timeZone.id).isValid);
      } catch (error) {
        logger.error("Failed to fetch time zones", error);
      }
    },
    updatePwaState(payload: any) {
      this.pwaState.registration = payload.registration;
      this.pwaState.updateExists = payload.updateExists;
    },
    async postLogin() {
      // Start every login from an empty local database. The logout wipe does not always run: a
      // session that expires while nothing is requesting (a closed tab, a sleeping laptop) lands on
      // /login without a 401 and so without `postLogout`, leaving the previous session's rows and its
      // once-per-login sync markers behind. The next login — the same user or another one — would
      // then skip the seed and read them. This hook runs once per real login (never on a reload),
      // before anything below reads the database, and stops a sync the `isAuthenticated` watcher in
      // App.vue may already have started against the old rows.
      await stopAppDbSync().catch((error) => logger.error("Failed to clear the local database on login", error));
      resetSessionStores();

      try {
        await this.fetchUserProfile();
        this.oms = cookieHelper().get("oms") || "";
        await this.fetchPermissions();
        await useProductStore().fetchProductStorePreference();

        // Start non-blocking Web Worker sync to hydrate and update the local IndexedDB
        void startAppDbSync();
      } catch (error: any) {
        return Promise.reject(error);
      }
    },
    /** Whether the OMS answers at all: any HTTP response counts, only a network failure does not. */
    async isOmsReachable(): Promise<boolean> {
      try {
        await api({
          url: commonUtil.isMoqui() ? "admin/user/permissions" : "getPermissions",
          method: "GET",
          baseURL: commonUtil.getOmsURL(),
          params: { viewIndex: 0, viewSize: 1 },
          timeout: 3000,
        });
        return true;
      } catch (error: any) {
        return Boolean(error?.response);
      }
    },

    async postLogout() {
      await stopAppDbSync().catch(() => { /* never block logout on cleanup */ });
      resetSessionStores();
      this.$reset();
    }
  },
  persist: true,
});
