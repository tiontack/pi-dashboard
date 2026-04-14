(function () {
  const DOC_KEYS = [
    'mysuni_pi_v3',
    'mysuni_courses_v2',
    'mysuni_org_targets_v1',
    'mysuni_org_targets_meta_v1',
    'pi_user_directory_v1',
    'pi_about_content_v1',
  ];

  let initPromise = null;
  const syncTimers = new Map();

  function getConfig() {
    const config = window.PI_CONFIG || {};
    if (!config.supabaseUrl || !config.supabaseAnonKey) return null;
    return {
      supabaseUrl: String(config.supabaseUrl).replace(/\/+$/, ''),
      supabaseAnonKey: config.supabaseAnonKey,
      tableName: config.tableName || 'pi_documents',
    };
  }

  function getHeaders(extra) {
    const config = getConfig();
    return {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      'Content-Type': 'application/json',
      ...extra,
    };
  }

  async function fetchDocuments() {
    const config = getConfig();
    if (!config) return [];
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/${config.tableName}?select=doc_key,payload,updated_at`,
      { headers: getHeaders() }
    );
    if (!response.ok) throw new Error(`Cloud fetch failed: ${response.status}`);
    return response.json();
  }

  async function upsertDocument(docKey, payload) {
    const config = getConfig();
    if (!config) return false;
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/${config.tableName}?on_conflict=doc_key`,
      {
        method: 'POST',
        headers: getHeaders({
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify([{ doc_key: docKey, payload }]),
      }
    );
    if (!response.ok) throw new Error(`Cloud upsert failed: ${response.status}`);
    return true;
  }

  function readLocalPayload(docKey) {
    const raw = localStorage.getItem(docKey);
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return raw;
    }
  }

  function writeLocalPayload(docKey, payload) {
    if (payload === undefined) return;
    const value = typeof payload === 'string' ? payload : JSON.stringify(payload);
    localStorage.setItem(docKey, value);
  }

  async function seedCloudFromLocal() {
    await Promise.all(
      DOC_KEYS.map(async docKey => {
        const payload = readLocalPayload(docKey);
        if (payload === null) return;
        await upsertDocument(docKey, payload);
      })
    );
  }

  async function hydrateLocalFromCloud(options) {
    const rows = await fetchDocuments();
    if (!Array.isArray(rows) || rows.length === 0) {
      if (options.seedDefaults) await seedCloudFromLocal();
      return;
    }
    rows.forEach(row => {
      if (!row || !row.doc_key) return;
      writeLocalPayload(row.doc_key, row.payload);
    });
  }

  window.pullPiCloudToLocal = async function (options = {}) {
    if (!getConfig()) return false;
    try {
      await hydrateLocalFromCloud(options);
      return true;
    } catch (error) {
      console.error('[PI Cloud Sync] pull failed', error);
      return false;
    }
  };

  window.isPiCloudSyncEnabled = function () {
    return !!getConfig();
  };

  window.initPiCloudSync = function (options = {}) {
    if (!getConfig()) return Promise.resolve(false);
    if (!initPromise) {
      initPromise = hydrateLocalFromCloud(options)
        .then(() => true)
        .catch(error => {
          console.error('[PI Cloud Sync] initialization failed', error);
          return false;
        });
    }
    return initPromise;
  };

  window.queueCloudSync = function (docKey, payload) {
    if (!getConfig() || !DOC_KEYS.includes(docKey)) return;
    if (syncTimers.has(docKey)) {
      clearTimeout(syncTimers.get(docKey));
    }
    syncTimers.set(
      docKey,
      setTimeout(async () => {
        try {
          const nextPayload = payload === undefined ? readLocalPayload(docKey) : payload;
          await upsertDocument(docKey, nextPayload);
        } catch (error) {
          console.error(`[PI Cloud Sync] failed to sync ${docKey}`, error);
        } finally {
          syncTimers.delete(docKey);
        }
      }, 300)
    );
  };
})();
