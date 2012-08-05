# JSDbCore

A full client-side javascript database library.

JSDbCore is a library created to simplify new Html5 javascript database API's.<br>
It uses Html5 technologies like IndexedDb and WebSql to implement a easier client-side database API, 
enabling web apps to run totally offline.

This is a start, so only the indexeddb api is partially complete.

*This technologies are experimental, so could apper some bugs, and the api could change.<br>
*Check the browser compatibility before try.

## QuickStart

Before try the examples take a look how setup your database.

#### Insert example

Inserting a tree in the forest database.

<pre>
	var model = JSDbCore.Model.New({store: 'trees', database: 'forest'}); //Create a new model
	modelTree.attributes = { name : 'Apple Tree' }; //Set the attributes
	modelTree.save(); //Save in database
</pre>

A three line insert. Aditionally you can setup a callback like this:

<pre>
	var model = JSDbCore.Model.New({store: 'trees', database: 'forest'});
	modelTree.attributes = { name : 'Apple Tree' };
	
	modelTree.afterSave = function () { // Set a callback.
		
		alert(modelTree.name + ' Inserted'); // Show an alert for each inserted model
	
	};
	
	modelTree.save();
</pre>

#### Find example

Let's find a record in the database. assuming that the record that we are looking for is an orange tree:
<pre>
	var model = JSDbCore.Model.New({store: 'trees', database: 'forest'}); //Create a new model
	
	//Set a callback afterFind. pass a param with an array of models found.
	modelTree.afterFind = function (contactsFound) {

		for(var i in contactsFound) 
			alert(contactsFound[i].attributes.name + ' Found'); //Show an alert for each model found
	
	};

	modelTree.dbcriteria.addCondition ({name: 'Orange Tree'}); // Add a condition.

	modelTree.findAllByCriteria(); // Find by the criteria conditions.			

</pre>

Simple isn't ?. Aditionally you have a lot of options like a SQL 'LIKE', inside objects search and others.

## Documentation 

The documentation isn't complete, but a parcial copy is in the repositories.
To see a example, download and execute the index.html example. 

Inside index.html is a script configuring a database, inserting a record, deleting and using the findAll
and findAllByCriteria methods.

Use this and the getting started pdf as a guide while the official documentation isn't released.

### License
Licensed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).