(function(){
	var app = angular.module('Notify', []);

	app.factory('Notify', [function(){
		return function(data){
            return noty({
                text: data.message,
                type: data.type || 'alert',
                dismissQueue: true,
                layout: data.layout || "topRight",
                theme: 'relax',
                timeout: (data.timeout != undefined)?data.timeout:3000,
                template: data.template,
                force: data.force,
                animation: data.animation,
                killer: data.killer
            });
        }
	}])

	
})()