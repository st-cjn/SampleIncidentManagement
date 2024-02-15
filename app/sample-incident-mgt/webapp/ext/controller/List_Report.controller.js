sap.ui.define(['sap/ui/core/mvc/ControllerExtension'], function (ControllerExtension) {
	'use strict';

	return ControllerExtension.extend('sampleincidentmgt.sampleincidentmgt.ext.controller.List_Report', {
		// this section allows to extend lifecycle hooks or hooks provided by Fiori elements
		override: {
			/**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf sampleincidentmgt.sampleincidentmgt.ext.controller.List_Report
             */
			onInit: function (oController) {
				// you can access the Fiori elements extensionAPI via this.base.getExtensionAPI
				var oModel = this.base.getExtensionAPI().getModel();
				//var oTable = this.getView().byId('IncidentsList');
				//.byId('Elementsap.ui.core.mvc.XMLView#sampleincidentmgt.sampleincidentmgt::IncidentsList');
				//oTable.unbindItems();

				//alert(oTable);
				//var button = new sap.ui.commons.button('go');
				//button.attachPress(function() {  
				//	this.extensionAPI.refreshTable('IncidentsList');
				//   }  )
				//this.byId("IncidentsList").getBinding("Incidents").refresh();
				//refresh();
			
				//this.extensionAPI.rebindTable('IncidentsObjectPage');
				//alert();
				//this.oController = oController;
            // Example to show attachpageDataLoaded event consumption.
             //this.oController.extensionAPI.attachPageDataLoaded(this.rebindIncidentsListTable.bind(this));
			},

			onPress: function(oEvent) {
				var oItem = oEvent.getSource(); //Get the Selected Item
				alert(oItem);
				//var oRouter = sap.ui.core.UIComponent.getRouterFor(this); //Get Hold of Router
				//Navigate to Detail Page with Selected Item Binding Context
				//oRouter.navTo("detail", {
				//  employeePath: oItem.getBindingContext("view").getPath().substr(1)
				//});
			  },

			rebindIncidentsListTable: function(){
				this.oController.extensionAPI.rebind("IncidentsList");
			},

			onAfterRebindTable: function (oEvent){
				oEvent.getParameter("bindingParams").preventTableBind = true
				oEvent.getSource().getTable().setBusy(true)

				// Raise a popup and persist a boolean value if the user has slected okay..
				// also persist the source, to trigger the rebindtable
				this.rebindSource = oEvent.getSource();
				alert('test');
			}
			//onBeforeRendering: function(){
			//	this.extensionAPI.refreshTable('IncidentsList');
			//}

			//onButtonPress: function(){
			//	this.extensionAPI.refreshTable('IncidentsList');
			//}
			
		}
	});
});
