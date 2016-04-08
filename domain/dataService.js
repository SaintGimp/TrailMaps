var Q = require('q');
var DocumentClient = require('documentdb-q-promises').DocumentClientWrapper;

var client = new DocumentClient(getHost(), { masterKey: getMasterKey() });
var documentsFeed = "dbs/saintgimp/colls/trailmaps"

function getHost() {
    if (process.env.DOCUMENTDB_URI) {
        console.log("DocumentDB host: " + process.env.DOCUMENTDB_URI);
        return process.env.DOCUMENTDB_URI;
    } else {
        throw "DOCUMENTDB_URI environment variable was not found.";
    }
}

function getMasterKey() {
    if (process.env.DOCUMENTDB_KEY) {
        return process.env.DOCUMENTDB_KEY;
    } else {
        throw "DOCUMENTDB_KEY environment variable was not found.";
    }
}

// From https://github.com/aliuy/documentdb-serverside-js/blob/master/stored-procedures/bulkDelete.js
var bulkDeleteSproc = {
    id: "bulkDelete",
    body: function bulkDelete(query) {
        var collection = getContext().getCollection();
        var collectionLink = collection.getSelfLink();
        var response = getContext().getResponse();
        var responseBody = {
            deleted: 0,
            continuation: true
        };

        // Validate input.
        if (!query) throw new Error("The query is undefined or null.");

        tryQueryAndDelete();

        // Recursively runs the query w/ support for continuation tokens.
        // Calls tryDelete(documents) as soon as the query returns documents.
        function tryQueryAndDelete(continuation) {
            var requestOptions = { continuation: continuation };

            var isAccepted = collection.queryDocuments(collectionLink, query, requestOptions, function(err, retrievedDocs, responseOptions) {
                if (err) throw err;

                if (retrievedDocs.length > 0) {
                    // Begin deleting documents as soon as documents are returned form the query results.
                    // tryDelete() resumes querying after deleting; no need to page through continuation tokens.
                    //  - this is to prioritize writes over reads given timeout constraints.
                    tryDelete(retrievedDocs);
                } else if (responseOptions.continuation) {
                    // Else if the query came back empty, but with a continuation token; repeat the query w/ the token.
                    tryQueryAndDelete(responseOptions.continuation);
                } else {
                    // Else if there are no more documents and no continuation token - we are finished deleting documents.
                    responseBody.continuation = false;
                    response.setBody(responseBody);
                }
            });

            // If we hit execution bounds - return continuation: true.
            if (!isAccepted) {
                response.setBody(responseBody);
            }
        }

        // Recursively deletes documents passed in as an array argument.
        // Attempts to query for more on empty array.
        function tryDelete(documents) {
            if (documents.length > 0) {
                // Delete the first document in the array.
                var isAccepted = collection.deleteDocument(documents[0]._self, {}, function(err, responseOptions) {
                    if (err) throw err;

                    responseBody.deleted++;
                    documents.shift();
                    // Delete the next document in the array.
                    tryDelete(documents);
                });

                // If we hit execution bounds - return continuation: true.
                if (!isAccepted) {
                    response.setBody(responseBody);
                }
            } else {
                // If the document array is empty, query for more documents.
                tryQueryAndDelete();
            }
        }
    }
};

var bulkInsertSproc = {
    id: "bulkInsert",
    body: function bulkImport(args) {
        var collection = getContext().getCollection();
        var collectionLink = collection.getSelfLink();

        // The count of imported docs, also used as current doc index.
        var count = 0;

        // Validate input.
        if (!args) throw new Error("The args are undefined or null.");
        if (!args.items) throw new Error("The array is undefined or null.");

        var docsLength = args.items.length;
        if (docsLength == 0) {
            getContext().getResponse().setBody({count:0});
            return;
        }

        // Call the create API to create a document.
        tryCreate(args.items[count], callback);

        // Note that there are 2 exit conditions:
        // 1) The createDocument request was not accepted. 
        //    In this case the callback will not be called, we just call setBody and we are done.
        // 2) The callback was called docs.length times.
        //    In this case all documents were created and we don’t need to call tryCreate anymore. Just call setBody and we are done.
        function tryCreate(doc, callback) {
            var isAccepted = collection.createDocument(collectionLink, doc, callback);

            // If the request was accepted, callback will be called.
            // Otherwise report current count back to the client, 
            // which will call the script again with remaining set of docs.
            if (!isAccepted) getContext().getResponse().setBody({count:count});
        }

        // This is called when collection.createDocument is done in order to process the result.
        function callback(err, doc, options) {
            if (err) throw err;

            // One more document has been inserted, increment the count.
            count++;

            if (count >= docsLength) {
                // If we created all documents, we are done. Just set the response.
                getContext().getResponse().setBody(count);
            } else {
                // Create next document.
                tryCreate(args.items[count], callback);
            }
        }
    }
}

function executeBulkInsert(documents) {
    console.log("Entering executeBulkInsert");
    return client.executeStoredProcedureAsync(documentsFeed + '/sprocs/bulkInsert', {items: documents.slice(0,1000)})
        .then(function(response) {
            var numberOfDocumentsInserted = response.result.count;
            if (numberOfDocumentsInserted < documents.length) {
                console.log("Continuing bulk insert");
                return executeBulkInsert(documents.slice(numberOfDocumentsInserted));
            }
        })
        .catch(function(error) {
            if (error.code === 429) {
                console.log("Retrying bulk insert after " + error.responseHeaders['x-ms-retry-after-ms'] + " ms");
                return Q.delay(error.responseHeaders['x-ms-retry-after-ms'])
                    .then(function() {
                        console.log("Doing retry");
                        return executeBulkInsert(documents);
                    });
            }
            else {
                console.log(error);
            };
        });

}

function executeBulkDelete(querySpec) {
    console.log("Entering executeBulkDelete");
    return client.executeStoredProcedureAsync(documentsFeed + '/sprocs/bulkDelete', querySpec)
        .then(function(response) {
            if (response.result.continuation) {
                console.log("Continuing bulk delete");
                return executeBulkDelete(querySpec);
            }
            else {
                console.log("Bulk delete complete")
            }
        })
        .catch(function(error) {
            if (error.code === 429) {
                console.log("Retrying bulk delete after " + error.responseHeaders['x-ms-retry-after-ms'] + " ms");
                return Q.delay(error.responseHeaders['x-ms-retry-after-ms'])
                    .then(function() {
                        console.log("Doing retry");
                        return executeBulkDelete(querySpec);
                    });
            }
            else {
                console.log(error);
            }
        });
}

exports.findDocuments = function(querySpec) {
    return client.queryDocuments(documentsFeed, querySpec)
        .toArrayAsync()
        .then(function(response) {
            return response.feed;
        });
};

exports.upsert = function(document) {
    return client.upsertDocumentAsync(documentsFeed, document);
};

exports.delete = function(documentId) {
    return client.deleteDocumentAsync(documentsFeed + "/docs/" + documentId);
};

exports.bulkInsert = function(documents) {
    return client.upsertStoredProcedureAsync(documentsFeed, bulkInsertSproc)
        .then(function(response) {
            return executeBulkInsert(documents);
        });
};

exports.bulkDelete = function(querySpec) {
    return client.upsertStoredProcedureAsync(documentsFeed, bulkDeleteSproc)
        .then(function(response) {
            return executeBulkDelete(querySpec);
        });
};
