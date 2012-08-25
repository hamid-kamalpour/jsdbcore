/*!
 * JSDbCore Javascript Model Database Framework  v0.1
 * 
 * Copyright 2012, Marcelo Piva
 * MIT License - http://www.opensource.org/licenses/mit-license.php
 *
 * Date: 28 Jul 2012
 *
 * This is a pre alpha release and some functionalities aren't included.
 *
 * Indexeddb and WebSQL api's are an experimental technology, so could have some bugs. 
 * Also the syntax and behavior is subject to change in future.
 *
 * SetVersion is Deprecated but is the only way to get this working on chrome
 *
 * // Doc stuff, will be moved to the right place 
 * - 31/07/2012 -
 *
 ** - fix 1 - search child attributes: now you can search a child attribute using this syntax:
 **
 ** DBCriteria.(addSearch or addCondition) ({ 'parentAttribute.childAttribute' : 'valueToSearch' });
 **
 ** Ex. treesModel.dbcriteria.addCondition({ 'fruit.color' : 'red' });
 **
 ** The following model will be returned because the attribute color of the fruit object is 'red':
 ** treesModel.attributes = { tree: 'apple tree', fruit: { color: 'red', name: 'apple' } };
 **
 ** - fix 2 - searching inside an array: if the model attribute is an array, the value to be search must exist in this array,
 ** to return true, else return false.
 **
 ** Ex. farmModel.dbcriteria.addCondition({ fruits: 'apple' });
 **
 ** The following model will be finded because the fruits array has an 'apple' item:
 ** farmModel.attributes = { fruits: ['orange', 'apple', 'gray'] };
 ** To access a determined index of the array, do this: { 'fruits.i': 'orange' } where the 'i' is the 'index'.
 **
 **
 * - 04/08/2012 - 
 *
 ** - fix 1 - searching inside the objects inside an array: this will search an string or number in the objects inside
 ** an array. see the following example:
 **
 ** Ex. farmModel.dbcriteria.addCondition({ 'fruits.color': 'red' }) ;
 **
 ** The following model will be finded because one of the inside objects of the array 'fruits' has an attribute color with the 'red' value.
 ** farmModel.attributes ({ fruits: [ { name: 'apple', color: 'red' }, { name: 'orange', color: 'orange' } ] });
 **
 ** - bug fix 2 - Update the setVersion method to the current api specification
 */

(function (undefined) {

	/**
	 * Class IndexedDb.
	 * This class process all indexed database request.
	 */
	var IndexedDb = {
		
		/** Create a new instance of the class **/
		New : function () {
			return new this.Class();
		},
		
		/** Constructor of the class **/
		Class : function () {
			
			/** Private vars **/
			var IndexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
			var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
			var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
			var IDBCursor = window.IDBCursor || window.webkitIDBCursor;  
			var db = null;
			
			
			/** Methods **/
			/** Check if browser support indexeddb **/
			this.isSupported = function () {
				
				return indexedDB ? true : false;
			
			};
			
			/** Check if database is already open **/
			this.isOpen = function () {
			
				return db ? true : false;
			
			}
			
			/**
			 * Open a new database instance, 
			 * and modify the database structure
             * if a different version is passed. 
			 * 
			 * @param config: contain the options of the db to be opened,
			 * like the version and the stores to create or remove in case of version change.
			 */
			this.open = function(config) {

				if(window.webkitIndexedDB) {
					var request = IndexedDB.open(config.name);
					
					request.onerror = function (e) {
						if(config.onOpenError)
							config.onOpenError(e);
					};
					
					request.onsuccess = function (e) {
								
						var version = config.version;
						db = e.target.result;
						var settingVersion = false;
						
						if(db.version != version) {
							settingVersion = true;
							var versionRequest = db.setVersion(version);
							
							versionRequest.onsuccess = function (e) {
							
								for (var i in config.removeStores) {
									var store = config.removeStores[i];
									if(db.objectStoreNames.contains(store.name)) {
										db.deleteObjectStore(store.name);
									}
								}
								
								for(var i in config.stores) {
									var store = config.stores[i];
									var arrayIndex = store.index;
									
									if(store.overwrite)
										if(db.objectStoreNames.contains(store.name))
											db.deleteObjectStore(store.name);
						
									var objectStore = db.createObjectStore (
										store.name,
										store.options
									);
									
									for(var c in arrayIndex) {
									
										var index = arrayIndex[c];
										objectStore.createIndex(index.attr, index.attr, index.options);
									}
								}
								
								settingVersion = false;
							}
							
							versionRequest.onfailure = config.errorOnOpen;
						}
						
						var settingVersionInterval = setInterval(function () {
						
							if(!settingVersion) {
								clearInterval(settingVersionInterval)
								if(config.afterOpen)
									config.afterOpen.apply();
							}
						}, 250);
						
					}
				} else {
				
					var request = IndexedDB.open(config.name, config.version);
					
					request.onerror = function (e) {
						if(config.onOpenError)
							config.onOpenError(e);
					};
				
					request.onupgradeneeded = function(e) {
						db = e.target.result;
						
						for (var i in config.removeStores) {
							var store = config.removeStores[i];
								if(db.objectStoreNames.contains(store.name)) {
									db.deleteObjectStore(store.name);
								}
							}
							
						for(var i in config.stores) {
							var store = config.stores[i];
							var arrayIndex = store.index;
							
							if(store.overwrite)
								if(db.objectStoreNames.contains(store.name))
									db.deleteObjectStore(store.name);
				
							var objectStore = db.createObjectStore (
								store.name,
								store.options
							);
							
							for(var c in arrayIndex) {
							
								var index = arrayIndex[c];
								objectStore.createIndex(index.attr, index.attr, index.options);
							}
						}
					}	
				
					request.onsuccess = function(e) {
						db = e.target.result;
						if(config.afterOpen)
							config.afterOpen.apply();
					};

				}
			};
      
			/** 
			 * Insert a new record on the database 
			 * @param model: the Model has the attributes to insert, 
			 * options and the functions to call on events.
			**/
			this.insert = function (model) {

				try {
					/** Open a new transaction and store with store name passed in model object **/
					var transaction = db.transaction([model.store], IDBTransaction.READ_WRITE);
					var objectStore = transaction.objectStore(model.store);
					var keyPath = objectStore.keyPath;
										
					if(keyPath) {
						
						/** 
						 * Verify if keyPath exist in attributes,
						 * if exist, parse it if is possible.
						**/
						if(model.attributes[keyPath] != undefined) {
							var parsedKey = parseFloat (model.attributes[keyPath]);
							if(parsedKey == model.attributes[keyPath])
								model.attributes[keyPath] = parsedKey;
						}
						
					}
					
					/** Request to add a model.attributes on the opened store if not exist **/
					var request = objectStore.add(model.attributes);					

					/** 
					 * On success, call afterSave function of the model, 
					 * and pass the created key as param 
					 **/
					request.onsuccess = function(e) {
						var result = e.target.result;
						model.key = result;
						if(keyPath)
							model.attributes[keyPath] = model.key;
						
						/** Set new record to false **/	
						model.isNewRecord = false;
						model.afterSave.apply(model, [model]);
					};
					
					/** On error, call errorOnSave of the model, passing the error **/
					request.onerror = function(e) {
						model.errorOnSave.apply(model, [e]);
					};
				} catch (e) {
					/** On Exception **/
					model.errorOnSave.apply(model, [e]);
				}
			}
			
			this.delete = function (model) {

				try {
					/** Open the transaction and the store with the options passed in the model **/
					var transaction = db.transaction([model.store], IDBTransaction.READ_WRITE);
					var objectStore = transaction.objectStore(model.store);
					var request = null;
					
					/** Get the keyPath of the store, if there is no keyPath, return null **/
					var keyPath = objectStore.keyPath;
					
					/** If keyPath exist **/
					if(keyPath) {
						
						/** 
						 * Verify if the key is set in the model ,
						 * if not, add the model attribute refferent to the key on model key
						**/
						if(model.key == undefined)
							if(model.attributes[keyPath])
								model.key = model.attributes[keyPath];

					}
						
					/** delete the record if a key is setted **/
					if(model.key) {
						/** Parse it if is possible **/
						var parsedKey = parseFloat (model.key);
						if(parsedKey == model.key)
							model.key = parsedKey;
							
						request = objectStore.delete(model.key);

						/** On sucess calls afterDelete method of the model passing the key updated**/
						request.onsuccess = function(e) {
							model.afterDelete.apply(model, [e]);
						};

						/** On error calls errorOnDelete of the model **/
						request.onerror = function(e) {
							model.errorOnDelete.apply(model, [e]);
						};
					}
				} catch (e) {
					/** Error. Call errorOnDelete with the error **/
					model.errorOnDelete.apply(model, [e]);
				}
			}
			
			/** 
			 * Update a record on the database
			 *
			 * @param model: the Model who will be updated, has the new Attributes
			 * and the options to pick an store and find the old record
			**/
			this.update = function (model) {
			
				try {
					/** Open the transaction and the store with the options passed in the model **/
					var transaction = db.transaction([model.store], IDBTransaction.READ_WRITE);
					var objectStore = transaction.objectStore(model.store);
					var request = null;
					
					/** Get the keyPath of the store, if there is no keyPath, return null **/
					var keyPath = objectStore.keyPath;
					
					/** Parse the if is possible **/
					var parsedKey = parseFloat (model.key);	
					if(parsedKey == model.key)
						model.key = parsedKey;
						
					/** If keyPath exist **/
					if(keyPath) {
						
						/** 
						 * Verify if keyPath exist in attributes,
						 * if not, add the model key to attributes object
						**/
						if(model.attributes[keyPath] == undefined)
							model.attributes[keyPath] = model.key;
						else {
							/** If keyPath is already set in the attributes, parse it if is possible **/
							var parsedKey = parseFloat (model.attributes[keyPath]);
							if(parsedKey == model.attributes[keyPath])
								model.attributes[keyPath] = parsedKey;
						}	
						
						/** Update the database **/
						request = objectStore.put(model.attributes);
						
					}
					else
						/** 
						 * If keyPath don't exist, 
						 * pass the key of the record to be update directly to the update function,
                         * with the attributes to insert in the database
                        **/
						request = objectStore.put(model.attributes, model.key);

					/** On sucess calls afterSave method of the model passing the key updated**/
					request.onsuccess = function(e) {
						var result = e.target.result;

						model.afterSave.apply(model, [result]);
					};

					/** On error calls errorOnSave of the model **/
					request.onerror = function(e) {
						model.errorOnSave.apply(model, [e]);
					};
				} catch (e) {
					/** Error. Call errorOnSave with the error **/
					model.errorOnSave.apply(model, [e]);
				}
			
			}
			
			/** 
			 * Find a record by pk - key
             * @param model: Model is passed with the info about store who will be searched,
			 * model has a object called DBCriteria who has the criteria of the search
	         */
			this.findByPk = function (model) {

				try {
					/** Open a transaction and the store passed **/
					var transaction = db.transaction([model.store]);
					var objectStore = transaction.objectStore(model.store);
					
					/** 
					 * Create a get request, passing the DBCriteria key property,
					 * this is the key that will be searched.
					 */
					if(model.dbcriteria.key) {
					
						/** Parse the key if is possible **/
						var parsedKey = parseFloat (model.dbcriteria.key);	
						if(parsedKey == model.dbcriteria.key)
							model.dbcriteria.key = parsedKey;
						
						var request = objectStore.get(model.dbcriteria.key);
				
						/** On error call errorOnfind of model passing the error **/
						request.onerror = function (e) {
							
							model.errorOnFind.apply(model, [e]);

						}
						
						/** On success is fired with the result **/
						request.onsuccess = function (e) {
							/** Search result **/
							var result = request.result;

							/** 
							 * Creates a new Model with the result ,
							 * config is cloned of the passed model,
							 * isNewRecord set to false,
							 */
							if(result) {
								var newModel = Model.New(model.config);
								newModel.attributes = result.value;
								newModel.key = result.key;
								newModel.isNewRecord = false;
								/** Call afterFind of passed model with the new Model **/
								model.afterFind.apply(model, [newModel]);
							}
							else
								/** If result in nothing, call afterFind of passed model with emptyParam **/
								model.afterFind.apply(model, []);
						
						}
					}
					
				} catch (e) {
					/** Error. call errorOnFind with error **/
					model.errorOnFind.apply(model, [e]);
				}

			}
			
			/** 
			 * Find a record using the options passed in model object
			 * @param model: pass the infos like database and store
			 * options to the find, like:
			 *
			 ** @param model.dbcriteria: contains the options and condition that will be used,
			 ** to search in database, more info in DBCriteria class: 
			 **
			 *** @param dbcriteria.limit: used to limit the search results,
			 *** in find and findByPk is set to 1, and the findAll methods -1.	
			 *** 	
			 *** @param dbcriteria.conditions: array with all the conditions,
			 ***
			 *** @param dbcriteria.useCriteria: flag set in case of findAll method and if you,
			 *** dont want to search with a criteria.
             ***
			 *** @param dbcriteria.mathAll, dbcriteria.getCondition: methods to get a condition
			 *** by the name of the related attribute, and match the attributes with the conditions.
			 ***
			 *** @param dbcriteria.obrigatory: set this flag true if all conditions have to match with criteria,
			 *** this true is like a AND on SQL, and false is like a OR.
 			 ***/
			this.find = function (model) {
				
				var transaction = db.transaction([model.store]);
				var objectStore = transaction.objectStore(model.store);
				var dbcriteria = model.dbcriteria;
				var objectsFound = [];
				var indexFound;
				var limit = dbcriteria.limit ? dbcriteria.limit : -1;
				var keyPath = objectStore.keyPath;
				
				if(!dbcriteria.useCriteria) {
					
					var cursor = objectStore.openCursor();
					
					cursor.onsuccess = function (e) {
						var result = e.target.result;
						
						if(result) {
						
							var newModel = Model.New(model.config);
							newModel.attributes = result.value;
							newModel.key = result.key;
							newModel.isNewRecord = false;
							
							objectsFound.push(newModel);
							
							if(objectsFound.length == limit) {
								model.afterFind.apply(model, [objectsFound]);
								return true;
							}
							
							result.continue();
						}
						else {
							model.afterFind.apply(model, [objectsFound]);
						}

					}
					
					cursor.onerror = function (e) {
						
							model.onFindError.apply(model, [e]);
						
					}
					
				} else {
				
					for(var i in dbcriteria.definedCriterias) {
					
						var criteria = dbcriteria.definedCriterias[i];
						var index = null; 
						
						try {
							index = objectStore.index(criteria.attr);
						} catch (e){
							index = null;
						}
						
						if(index) {
							indexFound = {attr: criteria.attr, index: index};
							break;
						}
					
					}
					
					if(indexFound) {

						var objIndex = indexFound;
						var criteria = dbcriteria.getCriteria(objIndex.attr);
						var cursor = objIndex.index.openCursor();
						
						cursor.onsuccess = function (e) {
							var result = e.target.result;

							if(result) {
								
								var key = result.key;
								var match = criteria.match(key);
								var newModel = Model.New(model.config);
								newModel.attributes = result.value;
								newModel.key = result.key;
								newModel.isNewRecord = false;
								if(newModel.attributes[keyPath])
									newModel.key = newModel.attributes[keyPath];
									
								if(match || !dbcriteria.obrigatory) {
									var matchAll = dbcriteria.matchAll(newModel.attributes);
									
									if(matchAll) {
										objectsFound.push(newModel);
										
										if(objectsFound.length == limit) {
											model.afterFind.apply(model, [objectsFound]);
											return true;
										}
												
									}
								}
									
								result.continue();
									
							}
							else {
								model.afterFind.apply(model, [objectsFound]);
							}
							
						}
						
						cursor.onerror = function (e) {
						
							model.onFindError.apply(model, [e]);
						
						}

					}
					else {
					
						var cursor = objectStore.openCursor();
						cursor.onsuccess = function (e) {
							var result = e.target.result;

							if(result) {
							
								var newModel = Model.New(model.config);
								newModel.attributes = result.value;
								newModel.key = result.key;
								newModel.isNewRecord = false;
								if(newModel.attributes[keyPath])
									newModel.key = newModel.attributes[keyPath];
								
								var matchAll = dbcriteria.matchAll(newModel.attributes);
								
								if(matchAll) {
									objectsFound.push(newModel);	
									
									if(objectsFound.length == limit) {
										model.afterFind.apply(model, [objectsFound]);
										return true;
									}
								}
							
								result.continue();
							}
							else {
								model.afterFind.apply(model, [objectsFound]);
							}

						}

						cursor.onerror = function (e) {
						
							model.onFindError.apply(model, [e]);
						
						}
					}
				}
			}
		}
	}


	var WebSQL = {

		New : function (config) {
			return new this.Class(config);
		},
		
		Class : function (config) {

		}
	}

	var Database = {

		New : function (config) {
			return new this.Class(config);
		},
				
		Class : function (config) {
			var dbDriver = null;
			
			var dbTypes = {
				indexeddb : 'indexeddb',
				websql : 'websql'
			};

			config.type = config.type ? config.type : dbTypes.indexeddb;	
			config.name = config.name ? config.name : 'undefined';
			config.version = config.version ? config.version : '1.0';
			
			this.config = config;
			
			if(this.config.type === dbTypes.indexeddb) {
				dbDriver = IndexedDb.New();
				dbDriver.open(config);
			
			}
			
			else if (this.config.type === dbTypes.websql) {
			
				
			
			}
			
			/** Methods **/
			this.insert = function (model) {
				
				dbDriver.insert.apply(dbDriver, [model]);			
			
			};
			
			this.find = function (model) {
			
				dbDriver.find.apply(dbDriver, [model]);
			
			}
			
			
			this.findByPk = function (model) {
			
				dbDriver.findByPk.apply(dbDriver, [model]);
			
			}
			
			this.update = function (model) {
			
				dbDriver.update.apply(dbDriver, [model]);
			
			}
			
			this.delete = function (model) {
			
				dbDriver.delete.apply(dbDriver, [model]);
			
			}
				
		}
				
	}

	var DBCriteria = {
		
		New : function () {
			return new this.Class();
		},
		
		Class : function () {
			
			this.definedCriterias = [];
			this.key = undefined;
			this.limit = false;
			this.obrigatory = false;
			
			/** Methods **/
			this.addSearch = function (attributes, options) {
				var options = options ? options : {};
				options.type = DBCriteria.search;
				options.range = options.range ? options.range : DBCriteria.allSearch;
				
				this.addCriteria(attributes, options);
			
			};
			
			this.addCriteria = function (attributes, options) {
				var options = options ? options : {};
				var type = options.type ? options.type : DBCriteria.condition;
				this.useCriteria = true;	
				
				for(var attrName in attributes) {
				
					var criteria = {
					
						attr: attrName,
						value: attributes[attrName],
						type: type,
						toRegExp: function () {
													
							var str = criteria.value;
							var regExp;
							
							if(options.range === DBCriteria.allSearch) 
								regExp = new RegExp(str);
							else if(options.range === DBCriteria.beginSearch) 
								regExp = new RegExp(str + '.*');
							else if(options.range === DBCriteria.endSearch)
								regExp = new RegExp('.*' + str);
								
							return regExp;						
							
						},
						match: function (valueToMatch) {
							
							var regExp = criteria.toRegExp();
							var finalResult = false;
							if(typeof valueToMatch !== 'undefined')
								if(!(valueToMatch.length > -1 && typeof valueToMatch === 'object'))
									valueToMatch = [valueToMatch];
							
							var arrayValueToMatch = valueToMatch;
							
							for(i in arrayValueToMatch) {
								
								var result = false;
								var valueToMatch = arrayValueToMatch[i];
								
								if(!(typeof valueToMatch == 'object'))
									
									if(type === DBCriteria.search) {
										valueToMatch = valueToMatch.toString();
										result = valueToMatch.match(regExp);
										
									}
									else if (type === DBCriteria.condition) {
									
										switch(options.operator) {
										
											case '==' :
												result = (criteria.value == valueToMatch);
												break;
											case '!=' :
												result = (criteria.value != valueToMatch);
												break;
											case '<=' :
												result = (criteria.value <= valueToMatch);
												break;
											case '>=' :
												result = (criteria.value >= valueToMatch);
												break;
											case '>' :
												result = (criteria.value > valueToMatch);
												break;
											case '<' :
												result = (criteria.value < valueToMatch);
												break;
										}
									}
								
								if(result)
									finalResult = true;
							}
							
							return finalResult ? true : false;
						}

					}
					this.definedCriterias.push(criteria);
				}
				
				

			}
			
			this.addCondition = function (attributes, options) {
				var options = options ? options : {};
				options.operator = options.operator ? options.operator : '==';
				options.type = DBCriteria.condition;
		
				this.addCriteria(attributes, options);
			
			};
			
			this.matchAll = function (objectToMatch) {
			
				var matchAll = false;	
				var hasCriteria = false;
				
				for(var i in this.definedCriterias) {
					hasCriteria = true;
	
					var currentCriteria = this.definedCriterias[i];
					
					var valueToMatch = objectToMatch[currentCriteria.attr];	
					var arrayCriteria = currentCriteria.attr.split('.');
					
					if(arrayCriteria.length > 1) {

						var lastObject = jQuery.extend(true, {}, objectToMatch);

						for(var i in arrayCriteria)						
							if(typeof lastObject != 'undefined') {
							
								if((typeof  lastObject == 'object') && (lastObject.length > -1) && (typeof lastObject[arrayCriteria[i]] === 'undefined')) {
									
									var arrayObject = [];
									for(var c in lastObject) {
									
										var currentObject = lastObject[c];
										var currentValue = currentObject[arrayCriteria[i]];
										
										if(currentValue) {
											
											if(typeof currentValue == 'object' && currentValue.length > -1) {
												for(var d in currentValue)
													arrayObject.push(currentValue[d]);
											}
											else
												arrayObject.push(currentValue);
										}
									}
									lastObject = arrayObject;
								} else
									lastObject = lastObject[arrayCriteria[i]];
																					
							}

						valueToMatch = lastObject;
					}						
					
					var passed = currentCriteria.match(valueToMatch);
					
					if(passed) 
						matchAll = true;
					if(!passed && this.obrigatory) {
						matchAll = false;
						break;
					}
				}
				
				if(hasCriteria)
					return matchAll
				else
					return true;
			}
			
			this.getCriteria = function (attr) {
				var foundCriteria;
				for(var i in this.definedCriterias) {
				
					var criteria = this.definedCriterias[i];
					if(criteria.attr == attr) {
						foundCriteria = criteria;
						break;
					}	
				
				}
				
				return foundCriteria;
			
			};
			
			this.clear = function () {
			
				this.definedCriterias = [];
				this.key = undefined;
				this.limit = false;
			
			}
		
		},
		
		/** Constants **/
		search: 1,
		condition: 2,
		beginSearch: 1,
		endSearch: 2,
		allSearch: 0

	}

	var Model = {

		New : function (config) {
			return new this.Class(config);
		},
		
		Class : function (config) {
			
			var currentDatabase = DbInstance.getDbInstance(config.database);
			this.config = config;
			this.store = config.store;
			this.attributes = {};
			this.dbcriteria = DBCriteria.New();
			this.isNewRecord = true;
			this.key = undefined;
			
			/** Methods **/
			
			this.afterSave = function () {};
			this.afterDelete = function () {};
			this.afterFind = function (result) { console.log(result); };
			
			this.errorOnSave = function (e) {console.log(e);};
			this.errorOnFind = function (e) {console.log(e);};
			this.errorOnDelete = function (e) {console.log(e);};
			
			this.getAttributes = function () {
				return JQuery.extend(true, {}, this.attributes);
			}
			
			this.findAllByCriteria = function () {
				this.dbcriteria.limit = -1;
				this.dbcriteria.useCriteria = true;
				currentDatabase.find.apply(currentDatabase, [this]);
			
			}
			
			this.find = function () {
			
				currentDatabase.find.apply(currentDatabase, [this]);
			
			}
			
			this.findAll = function () {
				this.dbcriteria.limit = -1;
				this.dbcriteria.useCriteria = false;	
				currentDatabase.find.apply(currentDatabase, [this]);
			
			}
			
			this.findByCriteria = function () {
				this.dbcriteria.useCriteria = true;
				this.dbcriteria.limit = 1;
				currentDatabase.find.apply(currentDatabase, [this]);
			
			}
			
			this.findByPk = function() {
			
				currentDatabase.findByPk.apply(currentDatabase, [this]);
			
			}
			
			this.save = function() {
				
				if(this.isNewRecord)
					currentDatabase.insert.apply(currentDatabase, [this]);
				else
					currentDatabase.update.apply(currentDatabase, [this]);
			}
			
			this.delete = function () {
			
				currentDatabase.delete.apply(currentDatabase, [this]);
			
			}
			
			this.match = function() {
			
				return this.dbcriteria.matchAll(this.attributes);
			
			}
		
		}
	}

	var DbClass = {

		New : function () {
			return new this.Class();
	
		},
		
		Class : function () {

			this.databases = {};
			
			this.init = function (config) {
				for(i in config.databases) {
				
					this.databases[config.databases[i].name] = Database.New(config.databases[i]);	
				
				}
			}
			
			this.getDbInstance = function (dbname) {
				return this.databases[dbname];
			}
			
			this.addDbInstance = function (dbconfig) {
				this.databases[dbconfig.name] = Database.New(dbconfig);
				return this.databases[dbconfig.name];
			}
			
			this.Model = Model;
			this.DBCriteria = DBCriteria;
			window.JSCore.Db = this;
	
		},	

	}
	
	var DbInstance = DbClass.New();
	
	
	
})();

