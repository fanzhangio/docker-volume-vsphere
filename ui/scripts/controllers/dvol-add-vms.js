/* global define $ */

define([], function() {
  'use strict';

  return function($scope, DialogService, DvolVmGridService, GridUtils) {

    var vmsAlreadyInTenant = DialogService.currentDialog().opaque.vmsAlreadyInTenant;
    function filterFn(vms) {
      return vms.filter(function(v) {
        return vmsAlreadyInTenant.indexOf(v.moid || v.id) < 0;
      });
    }
    var grid = DvolVmGridService.makeVmsGrid('vmsGrid', [], filterFn, 'MULTI', false);

    $scope.vmsGrid = grid.grid;

    var vmSearchOptions = {
      filters: [
        {
          field: 'name',
          operator: 'contains'
        }
      ],
      placeholder: 'Search'
    };

    GridUtils.addSearch($scope.vmsGrid, vmSearchOptions);

    DialogService.setConfirmOptions({
      label: 'Add',
      onClick: function() {
        DialogService.currentDialog().opaque.save($scope.vmsGrid
          .selectedItems);
        return true;
      }
    });

  };

});
