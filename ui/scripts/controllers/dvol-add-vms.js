/* global define $ */

define([], function() {
  'use strict';

  return function($scope, DialogService, DvolVmGridService, GridUtils) {

    var vmsAlreadyInTenant = DialogService.currentDialog().opaque.vmsAlreadyInTenant;
    function filterFn(vms) {
      return vms.filter(function(v) {
        return vmsAlreadyInTenant.indexOf(v.name) < 0;
      });
    }
    var grid = DvolVmGridService.makeVmsGrid('availableVmsGrid', [], filterFn, 'MULTI', false);

    $scope.availableVmsGrid = grid.grid;

    var vmSearchOptions = {
      filters: [
        {
          field: 'name',
          operator: 'contains'
        }
      ],
      placeholder: 'Search'
    };

    GridUtils.addSearch($scope.availableVmsGrid, vmSearchOptions);

    DialogService.setConfirmOptions({
      label: 'Add',
      onClick: function() {
        DialogService.currentDialog().opaque.save($scope.availableVmsGrid
          .selectedItems);
        return true;
      }
    });

  };

});
