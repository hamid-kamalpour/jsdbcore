(function (undefined) {
	
	var _JSCore = window.JSCore;	
	
	var JSCoreClass = {
		New: function () {
			return new this.Class();
		},
		
		Class: function () {
			this.loadedModules = [];
			this.loadQueue = [];
			
			this.loadModules = function (config) {
				var extPath = "http://localhost/jsdbcore/jscore/ext";
				var modulesPath = {
					"mvccore": {
							src: extPath + '/JSMvcCore.js',
							className: 'Mvc',
							dependencies: ['dbcore'],	
						},						
					"dbcore": {
							src: extPath + '/JSDbCore.js',
							className: 'Db'
						}				
				}

				for(var i in config.modules) {
					var module = config.modules[i];
					var load = modulesPath[module.name];
					var head = document.head;
					
					if(JSCore.loadedModules.indexOf(module.name) !== -1) {
						continue;	
					}
					
					var scriptElement = document.createElement('script');
					scriptElement.type = 'text/javascript';
					scriptElement.src = load.src;
					scriptElement.id = module.name;
					
					scriptElement.onload = (function (module, load) {
							
							var resolveModule =  function () {
								var moduleKey = JSCore.loadQueue.indexOf(module.name);
									
								//resolve dependencies.
								if(load.dependencies)	{
									
									for(var d in load.dependencies) {
										var dependModule = load.dependencies[d];
										
										//if dependencie is not loaded
										if(JSCore.loadedModules.indexOf(dependModule) === -1) {
											
											//if the module is not in the queue, load him.
											if(JSCore.loadQueue.indexOf(dependModule) === -1) {
												JSCore.loadModules({modules: [{name: dependModule, onLoad: function () {}}]});
											}
											
											var dependOnload = document.getElementById(dependModule).onload;
											var newOnload = (function (dependOnload) {
													
													return function () {
														dependOnload.apply(this, []);	
														resolveModule.apply(this, []);
													}
													
												})(dependOnload);
												
											document.getElementById(dependModule).onload = newOnload;	
											return true;									
										}									
									}	
								}
														
								module.onLoad.apply(JSCore, [JSCore[load.className]]);
								JSCore.loadedModules.push(module.name);
								JSCore.loadQueue.splice(moduleKey, 1);							
							};
							
							return resolveModule;
							
						})(module, load);
					
					head.appendChild(scriptElement);
					this.loadQueue.push(config.modules[i].name);
				}				
			}
			
			this.noConflict = function (newName) {
				
				window[newName] = JSCore;
				window.JSCore = _JSCore;
			
			}
			
		}	
	}
	var JSCore;
	window.JSCore = JSCore = JSCoreClass.New();
	
	

})();
