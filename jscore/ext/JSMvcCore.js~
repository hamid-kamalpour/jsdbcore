(function (undefined) {

	var Controller = {
		New: function (config) {
			return new this.Class(config);
		},

		Class: function (config) {
			config = config ? config : {};
			config.afterOpen = config.afterOpen ? config.afterOpen : '';
			config.errorOnOpen = config.errorOnOpen ? config.errorOnOpen : '';
			
			if(JSCore.Db) {
				JSCore.Db.addDbInstance({
					name: "controller",
					stores: [			
						{
							name: "struct",
							options: {keyPath: "id", autoIncrement: true},	
							index: [
								{attr: name, options: {unique: true}}							
							]						
						}
					],
					
					version: 1,
					afterOpen: config.afterOpen,
					errorOnOpen: config.errorOnOpen
				});
				
				this.redir = function (viewname) {
					var model = JSCore.Db.Model.New({store: 'struct', database: 'controller'});
				
					model.afterFind = function (viewfound) {
						var view = viewfound[0];
						if(view) {
							document.getElementById("app-content").innerHTML = view.attributes.html;			
							var re = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
							var result = [];
							
							while (result = re.exec(view.attributes.html)) {
								var script = result[1];
								(new Function(script))();						
							}			
		
						} else {
							console.log("view not found");
						}					
					};
					
					model.dbcriteria.addCondition({name: viewname});
					model.findByCriteria();	
					}
			}
			else {
				console.log("JCore DB Module is required.")	
			}			
					
		}

	}
	
	var View = {
		New: function () {
			return new this.Class();
		},

		Class: function () {
			
			if(JSCore.Db) {
				
				this.add = function () {
					var model = JSCore.Db.Model.New({store: "struct", database: "controller"});
					
					model.dbcriteria.addCondition({name: this.name});
					
					model.afterFind = function (found) {
						if(found.length === 0) {
							model.attributes = {name: this.name, html: this.html};
							model.save();
						}
						else {
							found.attributes.html = this.html;
							found.save();	
						}
					}

				}				
				
			}
			else {
				console.log("JCore DB Module is required.");	
			}			
					
		}

	}

	var MvcClass = {
		
		New: function () {
			return new this.Class();
		},
		
		Class: function () {
			
			this.init = function (config) {
				this.Controller = Controller.New(config);
				this.View = View;
			}
			window.JSCore.Mvc = this;		
			
		},

	}
	
	var MvcInstance = MvcClass.New();

})();