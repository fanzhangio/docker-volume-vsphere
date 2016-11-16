/* global define */

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
      var d = $q.defer();
      setTimeout(function() {
        var tenants = JSON.parse(localStorage.getItem('tenants')) || [];
        var matches = tenants.filter(function(t) {
          return t.id === tenantId;
        });
        var tenant = matches[0];
        if (tenant) {
          d.resolve(tenant);
        }
        setState(tenants);
      }, 200);
      return d.promise;
    }

    //
    // DvolVmodlService.listTenants
    //
    function getAll() {
      // var d = $q.defer();
      // setTimeout(function() {
      //   var tenants = JSON.parse(localStorage.getItem('tenants')) || [];
      //   d.resolve(tenants);
      //   setState(tenants);
      // }, 200);
      // return d.promise;
      return DvolVmodlService.listTenants()
      .then(function(tenants) {
        tenants.forEach(function(t) {
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
      var d = $q.defer();
      setTimeout(function() {
        tenant.id = generateId();
        tenant.vms = (vms || []).map(function(vm) {
          return vm.id;
        });
        tenant.datastores = {};
        var tenants = JSON.parse(localStorage.getItem('tenants')) || [];
        tenants.push(tenant);
        localStorage.setItem('tenants', JSON.stringify(tenants));
        d.resolve(tenants);
        setState(tenants);
      }, 200);
      return d.promise;
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

    //
    // DvolVmodlService.addVMsToTenant
    //
    function addVms(tenantId, vmIds) {
      var d = $q.defer();
      setTimeout(function() {
        var tenants = JSON.parse(localStorage.getItem('tenants')) || [];
        var matches = tenants.filter(function(t) {
          return t.id === tenantId;
        });
        if (!matches.length === 1) return; // TODO: handle asnyc error
        var tenant = matches[0];
        tenant.vms = tenant.vms || [];
        var newVms = dedupe(tenant.vms.concat(vmIds));
        tenant.vms = newVms;
        localStorage.setItem('tenants', JSON.stringify(tenants));
        d.resolve(tenant);
        setState(tenants);
      }, 200);
      return d.promise;
    }


    //
    // DvolVmodlService.addDatastoreAccessForTenant
    //
    function addDatastores(tenantId, datastores) {
      var d = $q.defer();
      setTimeout(function() {
        var tenants = JSON.parse(localStorage.getItem('tenants')) || [];
        var matches = tenants.filter(function(t) {
          return t.id === tenantId;
        });
        if (!matches.length === 1) return; // TODO: handle asnyc error
        var tenant = matches[0];
        tenant.datastores = tenant.datastores || {};
        datastores.forEach(function(ds) {
          tenant.datastores[ds.datastore] = ds;
        });
        localStorage.setItem('tenants', JSON.stringify(tenants));
        d.resolve(tenant);
        setState(tenants);
      }, 200);
      return d.promise;
    }

    //
    // DvolVmodlService.modifyDatastoreAccessForTenant
    //
    function updateDatastore(tenantId, newlyEditedDatastore) {
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
      var d = $q.defer();
      setTimeout(function() {
        var tenants = JSON.parse(localStorage.getItem('tenants')) || [];
        var matches = tenants.filter(function(t) {
          return t.id === newlyEditedTenant.id;
        });
        if (matches.length !== 1) return;  // needs async error handling
        var tenant = matches[0];
        if (!tenant) return; // needs async error handling
        dedupe(Object.keys(tenant).concat(Object.keys(newlyEditedTenant))).forEach(function(k) {
          tenant[k] = newlyEditedTenant.hasOwnProperty(k) ? newlyEditedTenant[k] : tenant[k];
        });
        localStorage.setItem('tenants', JSON.stringify(tenants));
        d.resolve(tenant);
        setState(tenants);
      }, 200);
      return d.promise;
    }

    var state = {};
    function setState(tenantsArr) {
      var tenantsObj = {};
      tenantsArr.forEach(function(t) {
        tenantsObj[t.id] = t;
      });
      state.tenants = tenantsObj;
    }

    this.getAll = getAll;
    this.removeDatastore = removeDatastore;
    this.removeVm = removeVm;
    this.remove = remove;
    this.get = get;
    this.add = add;
    this.addVms = addVms;
    this.addDatastores = addDatastores;
    this.updateDatastore = updateDatastore;
    this.update = update;
    this.state = state;

  };

});
