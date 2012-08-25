
// default configuration object
JSDbCore.defaultConfig = {

	// each item inside this array will create or open a database
	databases: [ 
			{
				name: 'database_name', // the name of the database to open or create
				
				//each item inside this array represent a store to be create or update
				stores: [ 
					{
						
						name: 'store_name', // the store name. store are like a SQL table without a schema
						
						// an object with options
						options: { 
							
							//the keyPath option sets a param to act like a SQL Primary Key. 
							//this will be better explained later
							keyPath: 'id', 
							
							autoIncrement: 	true //auto increment the keyPath
						},		
					}
				
				],
				
				//this is the version of the database.
				//the only way to update a database structure is setting his version.
				version: 1,  
				
				//this callback will be executed after the database is open and ready to use
				afterOpen: function () { 
				},
				
				//if an error ocurs this will be called. 
				errorOnOpen : function () { 
				}
				
			}
		]
	};
	
JSDbCore.New(); //Init the application.

var modelTree = JSDbCore.Model.New({database: 'Forest', store: 'Trees'});

modelTree.attributes = { name: 'Apple tree', color: 'Green' };

modelTree.save();

