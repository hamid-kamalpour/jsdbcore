(function (undefined) {
	
	var _guime = window.guime;	

	var GuimeClass = {
		New: function () {
			return new this.Class();
		},
		
		Class: function () {
			this.loadedModules = [];
			this.loadQueue = [];
			
			this.loadModules = function (config) {
				var extPath = "http://localhost/jsdbcore/jscore/ext";
				var modulesPath = {
					"jquery": {
						src: "http://code.jquery.com/jquery-1.8.0.min.js",
						className: 'jquery'
					},
					"utils": {
						src: extPath + '/UtilsClass.js',
						className: 'utils',
						dependencies: ['jquery']
					},
					"model": {
						src: extPath + '/ModelClass.js',
						className: 'model',
						dependencies: ['db']
					},						
					"db": {
						src: extPath + '/DatabaseClass.js',
						className: 'db',
						dependencies: ['jquery']
					},				
					"controller": {
						src: extPath + '/ControllerClass.js',
						className: 'controller',
						dependencies: ['db', 'model']
					},				
					"view": {
						src: extPath + '/ViewClass.js',
						className: 'view',
						dependencies: ['db', 'model', 'controller', 'utils']
					}				
				}
				
				for(var i in config.modules) {
					this.loadQueue.push(config.modules[i].name);	
				}

				for(var i in config.modules) {
					var module = config.modules[i];
					
					
					if(guime.loadedModules.indexOf(module.name) !== -1) {
						continue;	
					}
					
					module.onLoad = module.onLoad ? module.onLoad : function () {};					
					
					if(modulesPath[module.name]) {
						var load = {};
						load = modulesPath[module.name];
						module.load = load;
					} else if (module.src) {
						var load = {};
						load.src = module.src;
						load.dependencies = module.dependencies;
						module.load = load;
					}
					if(config.type === "Dom" || true) {
						this.loadByDom(module);					
					} else {
						this.loadByAjax(module);	
					}
					
	
				}				
			}
			/*********************/
			this.loadByAjax = function (module) {
				
			}
			/*********************/
			this.loadByDom = function (module) {
				var scriptElement = document.createElement('script');
				var head = document.head;
				var onload = undefined;
				var load = module.load;
				var resolveModule;				
				
				scriptElement.type = 'text/javascript';
				scriptElement.src = load.src;
				scriptElement.id = module.name;
	
				scriptElement.onload = resolveModule = function () {
					var moduleKey = guime.loadQueue.indexOf(module.name);
					load.dependencies = load.runDependencies;
					//resolve dependencies.
					if(load.dependencies)	{
						
						for(var d in load.dependencies) {
							var dependModule = load.dependencies[d];
							
							//if dependencie is not loaded
							if(guime.loadedModules.indexOf(dependModule) === -1) {
								
								//if the module is not in the queue, load him.
								if(guime.loadQueue.indexOf(dependModule) === -1) {
									guime.loadModules({modules: [{name: dependModule, onLoad: function () {}}]});
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
		
					module.onLoad.apply(guime, [guime[load.className]]);
					guime.loadedModules.push(module.name);
					guime.loadQueue.splice(moduleKey, 1);							
				};
				
				var loadInterval = setInterval ( (function (load, loadInterval, scriptElement) {
					scriptElement.loadTrys = 0;				
					return function () {
						var unloadDependencie = false;

						for(var i in load.dependencies) {
							var dependModule = load.dependencies[i];
							
							if(guime.loadedModules.indexOf(dependModule) === -1) {
								
								//if the module is not in the queue, load him.
								if(guime.loadQueue.indexOf(dependModule) === -1) {
									guime.loadModules({modules: [{name: dependModule, onLoad: function () {}}]});
								} else {
									scriptElement.loadTrys++;	
								}
								unloadDependencie = true;
								
							}									
						}
						
						if(!unloadDependencie) {
							head.appendChild(scriptElement);
							clearInterval(loadInterval);
						} else if(scriptElement.loadTrys > 100000) {
							console.log("unable to load module :" + load.src)							
							clearInterval(loadInterval);	
						}
					}
						
				})(load, loadInterval, scriptElement), 1);
				
			}
			
			/**************************************/
			this.noConflict = function (newName) {
				
				window[newName] = guime;
				window.guime = _guime;
			
			}
			
		}	
	}
	var guime;
	window.guime = guime = GuimeClass.New();
	guime.loadModules({modules: [{name: 'jquery'}]});
	
	

})();
