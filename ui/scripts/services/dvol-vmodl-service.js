/* global define */

define([], function() {
  'use strict';

  return function(DvolSoapService) {

    this.listTenants = function() {
      return DvolSoapService.request('ListTenants');
    };

    this.createTenant = function(args) {
      var argsSOAP = [
        '<name>' + args.name + '</name>',
        '<description>' + args.description + '</description>',
        '<default_datastore>' + args.defaultDatastore + '</default_datastore>',
        '<default_privileges>' + args.defaultPrivileges + '</default_privileges>'
      ].join('');
      return DvolSoapService.request('CreateTenant', argsSOAP);
    };

    this.removeTenant = function(args) {
      var argsSOAP = [
        '<name>' + args.name + '</name>'
      ].join('');
      return DvolSoapService.request('RemoveTenant', argsSOAP);
    };

    this.addDatastoreAccessForTenant = function(args) {
      var argsSOAP = [
        '<name>' + args.name + '</name>',
        '<datastore>' + args.datastore + '</datastore>',
        '<rights>' + JSON.stringify(args.rights) + '</rights>',
        '<volume_maxsize>' + args.volume_maxsize + '</volume_maxsize>',
        '<volume_totalsize>' + args.volume_totalsize + '</volume_totalsize>'
      ].join('');
      return DvolSoapService.request('AddDatastoreAccessForTenant', argsSOAP);
    };

    this.modifyDatastoreAccessForTenant = function(args) {
      var argsSOAP = [
        '<name>' + args.name + '</name>',
        '<datastore>' + args.datastore + '</datastore>',
        '<add_rights>' + JSON.stringify(args.add_rights) + '</add_rights>',
        '<remove_rights>' + JSON.stringify(args.remove_rights) + '</remove_rights>',
        '<volume_maxsize>' + args.volume_maxsize + '</volume_maxsize>',
        '<volume_totalsize>' + args.volume_totalsize + '</volume_totalsize>'
      ].join('');
      return DvolSoapService.request('ModifyDatastoreAccessForTenant', argsSOAP);
    };

    this.addVMsToTenant = function(args) {
      var argsSOAP = [
        '<name>' + args.name + '</name>',
        '<vms>' + JSON.stringify(args.vms) + '</vms>'
      ].join('');
      return DvolSoapService.request('AddVMsToTenant', argsSOAP);
    };

    this.removeVMsFromTenant = function(args) {
      var argsSOAP = [
        '<name>' + args.name + '</name>',
        '<vms>' + JSON.stringify(args.vms) + '</vms>'
      ].join('');
      return DvolSoapService.request('RemoveVMsFromTenant', argsSOAP);
    };

    this.listVMsForTenant = function(args) {
      var argsSOAP = [
        '<name>' + args.name + '</name>'
      ].join('');
      return DvolSoapService.request('ListVMsForTenant', argsSOAP);
    };

    this.getDatastoreAccessPrivileges = function() {
      return DvolSoapService.request('GetDatastoreAccessPrivileges');
    };

    this.createDatastoreAccessPrivileges = function(args) {
      var argsSOAP = [
        '<datastore>' + args.datastore + '</datastore>',
        '<create_volumes>' + args.create_volumes + '</create_volumes>',
        '<delete_volumes>' + args.delete_volumes + '</delete_volumes>',
        '<mount_volumes>' + args.mount_volumes + '</mount_volumes>',
        '<max_volume_size>' + args.max_volume_size + '</max_volume_size>',
        '<usage_quota>' + args.usage_quota + '</usage_quota>'
      ].join('');
      return DvolSoapService.request('CreateDatastoreAccessPrivileges', argsSOAP);
    };

    this.removeDatastoreAccessForTenant = function(args) {
      var argsSOAP = [
        '<name>' + args.name + '</name>',
        '<datastore>' + args.datastore + '</datastore>'
      ].join('');
      return DvolSoapService.request('RemoveDatastoreAccessForTenant', argsSOAP);
    };

    this.listDatastoreAccessForTenant = function(args) {
      var argsSOAP = [
        '<name>' + args.name + '</name>'
      ].join('');
      return DvolSoapService.request('ListDatastoreAccessForTenant', argsSOAP);
    };

  };

});
