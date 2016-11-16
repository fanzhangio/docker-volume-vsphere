/* global define $ */

define([], function() {
  'use strict';

  return function($scope, DialogService, DvolVmGridService, GridUtils) {

    $scope.tenant = DialogService.currentDialog().opaque.tenant;
    $scope.editMode = DialogService.currentDialog().opaque.editMode;

    DialogService.setConfirmOptions({
      label: $scope.editMode ? 'Save' : 'Add',
      onClick: function() {
        DialogService.currentDialog().opaque.save($scope.tenant, $scope.vmsGrid.selectedItems);
        return true;
      }
    });

    var grid = DvolVmGridService.makeVmsGrid('availableVmsGrid', [], null, 'MULTI', false);

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

  };

});
