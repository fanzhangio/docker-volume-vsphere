/* global define _ */

define([], function() {
  'use strict';

  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  return function($q, DvolVmodlService) {

    //
    // We might want to have a get action for tenant
    // As the api stands now, we'd need to run:
    //
    // DvolVmodlService.listTenants
    // DvolVmodlService.listDatastoreAccessForTenant
    // DvolVmodlService.listVMsForTenant
    //
    function get(tenantId) {
      return getAll()
      .then(function(tenants) {
        setState(tenants);
        return pickTenantById(tenantId, tenants);
      });
    }

    //
    // DvolVmodlService.listTenants
    //
    function getAll() {
      return DvolVmodlService.listTenants()
      .then(function(tenants) {
        tenants.forEach(function(t,i) {
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

    //
    // DvolVmodlService.createTenant
    // DvolVmodlService.addVMsToTenant
    //
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

    //
    // DvolVmodlService.removeTenant
    //
    function remove(tenantId) {
      var d = $q.defer();
      setTimeout(function() {
        var tenants = JSON.parse(localStorage.getItem('tenants')) || [];
        var newTenants = tenants.filter(function(t) {
          return t.id !== tenantId;
        });
        localStorage.setItem('tenants', JSON.stringify(newTenants));
        d.resolve(newTenants);
        setState(tenants);
      }, 200);
      return d.promise;
    }

    //
    // DvolVmodlService.removeDatastoreAccessForTenant
    //
    function removeDatastore(tenantId, datastoreId) {
      var d = $q.defer();
      setTimeout(function() {
        var tenants = JSON.parse(localStorage.getItem('tenants')) || [];
        var matches = tenants.filter(function(t) {
          return t.id === tenantId;
        });
        if (!matches.length === 1) return; // handle error
        var tenant = matches[0];
        delete tenant.datastores[datastoreId];
        localStorage.setItem('tenants', JSON.stringify(tenants));
        d.resolve();
        setState(tenants);
      }, 200);
      return d.promise;
    }

    //
    // DvolVmodlService.removeVMsFromTenant
    //
    // NOTE: decide if we want to support multiple VMs at same time
    // as it is now, we would just call the api with a single vm
    // and not take advantage of the multiple vm option
    //
    function removeVm(tenantId, removeThisId) {
      var d = $q.defer();
      setTimeout(function() {
        var tenants = JSON.parse(localStorage.getItem('tenants')) || [];
        var matches = tenants.filter(function(t) {
          return t.id === tenantId;
        });
        if (!matches.length === 1) return; // handle error
        var tenant = matches[0];
        if (!tenant.vms || tenant.vms.length < 1) return; // handle error
        var newAssocs = tenant.vms.filter(function(assocId) {
          return assocId !== removeThisId;
        });
        tenant.vms = newAssocs;
        localStorage.setItem('tenants', JSON.stringify(tenants));
        d.resolve(tenant);
        setState(tenants);
      }, 200);
      return d.promise;
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

    //
    // DvolVmodlService.addVMsToTenant
    //
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
    //
    // DvolVmodlService.addDatastoreAccessForTenant
    //
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

    //
    // DvolVmodlService.modifyDatastoreAccessForTenant
    //
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





      var d = $q.defer();
      setTimeout(function() {
        var tenants = JSON.parse(localStorage.getItem('tenants')) || [];
        var matches = tenants.filter(function(t) {
          return t.id === tenantId;
        });
        if (matches.length !== 1) return;  // needs async error handling
        var tenant = matches[0];
        if (!tenant) return; // needs async error handling
        tenant.datastores[newlyEditedDatastore.datastore] = newlyEditedDatastore;
        localStorage.setItem('tenants', JSON.stringify(tenants));
        d.resolve(tenant);
        setState(tenants);
      }, 200);
      return d.promise;
    }

    //
    // ??? This is missing in API
    //
    function update(newlyEditedTenant) {
      // var d = $q.defer();
      // setTimeout(function() {
      //   var tenants = JSON.parse(localStorage.getItem('tenants')) || [];
      //   var matches = tenants.filter(function(t) {
      //     return t.id === newlyEditedTenant.id;
      //   });
      //   if (matches.length !== 1) return;  // needs async error handling
      //   var tenant = matches[0];
      //   if (!tenant) return; // needs async error handling
      //   dedupe(Object.keys(tenant).concat(Object.keys(newlyEditedTenant))).forEach(function(k) {
      //     tenant[k] = newlyEditedTenant.hasOwnProperty(k) ? newlyEditedTenant[k] : tenant[k];
      //   });
      //   localStorage.setItem('tenants', JSON.stringify(tenants));
      //   d.resolve(tenant);
      //   setState(tenants);
      // }, 200);
      // return d.promise;
    }

    // "state"
    // -----
    //
    // READING from "state"
    //
    // "state" is a representation of the tenants objects in memory
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
    // TODO: refactor this to put the setState call at a lower level
    //

    var state = {};
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

    this.getAll = getAll;
    this.removeDatastore = removeDatastore;
    this.removeVm = removeVm;
    this.remove = remove;
    this.get = get;
    this.add = add;
    this.addVms = addVms;
    this.addDatastore = addDatastore;
    this.updateDatastore = updateDatastore;
    this.update = update;
    this.getState = getState;

  };

});
