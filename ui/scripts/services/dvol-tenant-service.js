/* global define _ */

define([], function() {
  'use strict';

  return function($q, DvolVmodlService) {

    var state = {};

    //
    // Local Application State
    // -----------------------
    //
    // The "state" variable is a representation of the tenants list in memory
    //
    // READING from "state"
    //
    // it's exposed for read-only use via this service's getState() method returning a copy
    // it's meant to be available to the rest of the UI
    // for situations where up-to-date global state isn't required
    // and/or hasn't been requested (e.g. via the refresh buttons) by the user
    //
    // WRITING to "state"
    //
    // currently all mutable state for this UI is contained within the Tenant List
    // so "state" is just a list of tenants (in the form of an object keyed by tenant id)
    // AND any mutation to application state must go through this service
    //
    // "state" is private to this service
    // it's expected that any function that communicates with the server
    // will be followed by:
    // 1) if it's not already present in the server's response,
    //    the function must obtain the current Tenant List from the server
    // 2) the function must call setState, passing this current Tenant List (as an array)
    //    to replace the previous "state" value with the current one
    //
    // TODO: refactor this to put the setState
    //

    function setState(tenantsArr) {
      var tenantsObj = {};
      tenantsArr.forEach(function(t) {
        tenantsObj[t.id] = t;
      });
      state.tenants = tenantsObj;
    }

    function getState() {
      return _.clone(state);
    }


    //
    // eventually the VMODL api will support get Tenant by ID
    // for now we just use getAll
    //
    function get(tenantId) {
      return getAll()
      .then(function(tenants) {
        setState(tenants);
        return pickTenantById(tenantId, tenants);
      });
    }

    function getAll() {
      return DvolVmodlService.listTenants()
      .then(function(tenants) {
        tenants.forEach(function(t, i) {
          t.id = t.name;
          // t.vms = t.vms || [];
          // t.datastores = t.datastores || [];
          //
          // TODO: unplug these fixtures
          //
          t.vms = ['Tuna VM', 'Salmon VM'];
          t.datastores = {
            'datastore1': {
              datastore: 'datastore1',
              permissions: {
                create_volumes: true,
                delete_volumes: false,
                mount_volumes: false,
                max_volume_size: '2TB',
                usage_quota: '600GB'
              }
            },
            'bugs.eng.vmware.com_0': {
              datastore: 'bugs.eng.vmware.com_0',
              permissions: {
                create_volumes: true,
                delete_volumes: true,
                mount_volumes: true,
                max_volume_size: '10TB',
                usage_quota: '4TB'
              }
            }
          };
          if (i === 0) {
            t.vms.push('Shark VM');
            delete t.datastores['bugs.eng.vmware.com_0'];
          }
        });
        setState(tenants);
        return tenants;
      });
    }

    function add(tenant, vms) {
      var tenantArgs = {
        name: tenant.name,
        description: tenant.description,
        default_privileges: tenant.default_privileges
      };
      return   DvolVmodlService.createTenant(tenantArgs)
      .then(function() {
        var vmsArgs = {
          name: tenant.name,
          vms: vms
        };
        return DvolVmodlService.addVMsToTenant(vmsArgs);
      })
      .then(getAll)
      .then(function(tenants) {
        setState(tenants);
        return tenant;
      });
    }

    function remove(tenantId) {
      DvolVmodlService.removeTenant(tenantId)
      .then(getAll)
      .then(function(tenants) {
        setState(tenants);
        return tenants;
      });
    }

    function removeDatastore(tenantId, datastoreId) {
      return DvolVmodlService.removeDatastoreAccessForTenant(tenantId, datastoreId)
      .then(getAll)
      .then(function(tenants) {
        setState(tenants);
        return getState()[tenantId];
      });
    }

    //
    // NOTE: the VMODL api supports removing multiple VMs in same call
    // Our original removeVm implementation supports only one,
    // so we just call the api with a single vm
    // and not take advantage of the multiple vm option for now
    //
    function removeVm(tenantId, vmId) {
      return DvolVmodlService.removeVMsFromTenant(tenantId, [vmId])
      .then(getAll)
      .then(function(tenants) {
        setState(tenants);
        return getState()[tenantId];
      });
    }

    function dedupe(a) {
      return a.filter(function(item, pos) {
        return a.indexOf(item) === pos;
      });
    }

    function pickTenantById(tenantId, tenants) {
      var matches = tenants.filter(function(t) {
        return t.id === tenantId;
      });
      if (!matches.length === 1) {
        console.log('tenant does not match');
        //
        // TODO: better error handling
        //
      }
      var tenant = matches[0];
      return tenant;
    }

    function addVms(tenantId, vmIds) {
      return DvolVmodlService.addVMsToTenant({
        name: tenantId,
        vms: vmIds
      })
      .then(getAll)
      .then(function(tenants) {
        //
        // TODO: remove this fixture once API is ready
        //
        var tenant = pickTenantById(tenantId, tenants);
        tenant.vms = tenant.vms || [];
        var newVms = dedupe(tenant.vms.concat(vmIds));
        tenant.vms = newVms;
        //
        //
        //
        setState(tenants);
        return tenant;
      });

    }

    function getRightsFromPermissions(perms) {
      return ['create', 'mount', 'delete'].filter(function(r) {
        return perms[r + '_volumes'];
      });
    }

    function addDatastore(tenantId, datastore) {
      return DvolVmodlService.addDatastoreAccessForTenant({
        name: tenantId,
        datastore: datastore.datastore.name,
        rights: getRightsFromPermissions(datastore.permissions),
        volume_maxsize: datastore.permissions.volume_maxsize,
        volume_totalsize: datastore.permissions.volume_totalsize
      })
      .then(getAll)
      .then(function(tenants) {
        //
        // TODO: remove this fixture once API is ready
        //
        var tenant = pickTenantById(tenantId, tenants);
        tenant.datastores = tenant.datastores || {};
        tenant.datastores[datastore.datastore.name] = datastore.datastore;
        //
        //
        //
        setState(tenants);
        return tenant;
      });
    }

    function updateDatastore(tenantId, updatedDatastore) {
      var add_rights = [];
      var remove_rights = [];
      ['create', 'mount', 'delete'].forEach(function(p) {
        if (updatedDatastore.permissions[p + '_volumes']) {
          add_rights.push(p);
        } else {
          remove_rights.push(p);
        }
      });
      return DvolVmodlService.modifyDatastoreAccessForTenant({
        name: tenantId,
        datastore: updatedDatastore.datastore.name,
        add_rights: add_rights,
        remove_rights: remove_rights,
        volume_maxsize: updatedDatastore.permissions.volume_maxsize,
        volume_totalsize: updatedDatastore.permissions.volume_totalsize
      })
      .then(getAll)
      .then(function(tenants) {
        //
        // TODO: remove this fixture once API is ready
        //
        var tenant = pickTenantById(tenantId, tenants);
        tenant.datastores = tenant.datastores || {};
        tenant.datastores[updatedDatastore.datastore.name] = updatedDatastore.datastore;
        //
        //
        //
        setState(tenants);
        return tenant;
      });
    }

    this.getAll = getAll;
    this.removeDatastore = removeDatastore;
    this.removeVm = removeVm;
    this.remove = remove;
    this.get = get;
    this.add = add;
    this.addVms = addVms;
    this.addDatastore = addDatastore;
    this.updateDatastore = updateDatastore;
    this.getState = getState;

  };

});
