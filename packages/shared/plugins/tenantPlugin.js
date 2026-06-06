// packages/shared/plugins/tenantPlugin.js
'use strict';

/**
 * Mongoose plugin that enforces tenantId scoping on every query.
 *
 * How it works:
 * - Before any find/update/delete, if req context has tenantId, inject it
 * - We use a AsyncLocalStorage context to pass tenantId from middleware → mongoose
 * - This means even if a developer forgets, the plugin enforces it
 *
 * Interview answer: "Data isolation is architectural, not per-developer discipline."
 */

const { AsyncLocalStorage } = require('async_hooks');

// This storage holds the current tenantId for the duration of each HTTP request
const tenantContext = new AsyncLocalStorage();

function tenantPlugin(schema) {
  // List of query methods to intercept
  const queryMethods = [
    'find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete',
    'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'countDocuments',
  ];

  queryMethods.forEach((method) => {
    schema.pre(method, function () {
      const store = tenantContext.getStore();
      if (!store || !store.tenantId) return; // system jobs (worker) run without context

      // Only inject if schema actually has a tenantId field
      if (schema.path('tenantId')) {
        // Don't override if already explicitly set
        if (!this.getFilter().tenantId) {
          this.where({ tenantId: store.tenantId });
        }
      }
    });
  });

  // Also enforce on save() — new documents get tenantId automatically
  schema.pre('save', function () {
    const store = tenantContext.getStore();
    if (!store || !store.tenantId) return;

    if (schema.path('tenantId') && !this.tenantId) {
      this.tenantId = store.tenantId;
    }
  });
}

module.exports = { tenantPlugin, tenantContext };