// Import required modules: Azure Cognitive Search SDK for interacting with Azure Search,
// Azure Functions for the serverless function framework, and application-specific configuration.
const { SearchClient, AzureKeyCredential } = require("@azure/search-documents");
const { app } = require('@azure/functions');
const { CONFIG } = require("../lib/config");

// Initialize the SearchClient with the service URL, index name, and API key from configuration.
// This client is used to communicate with the Azure Cognitive Search service.
const client = new SearchClient(
    `https://` + CONFIG.SearchServiceName + `.search.windows.net/`, // Constructs the service URL.
    CONFIG.SearchIndexName, // Specifies which search index to use.
    new AzureKeyCredential(CONFIG.SearchApiQueryKey) // Authenticates the client using the API key.
);

// Define a new HTTP-triggered Azure Function named 'lookup'
app.http('lookup', {
    methods: ['GET'], // Specifies that the function responds to GET requests.
    authLevel: 'anonymous', // Indicates that no authentication is required to access this function.
    handler: async (request, context) => { // The main function handler.
        context.log(`Lookup processed request for url "${request.url}"`); // Logs the request URL for debugging purposes.

        try {
            // Extracts the 'id' parameter from the query string of the request URL.
            const id = request.query.get('id');
            console.log(id); // Logs the document ID for debugging.

            // Validates if the 'id' parameter is provided; if not, returns a 404 status code.
            if (!id) {
                return {
                    status: 404 // Indicates that the requested resource could not be found.
                };
            }

            // Fetches the document with the specified ID from the Azure Search index.
            const document = await client.getDocument(id);

            // Returns the fetched document in the response body.
            return { jsonBody: { document: document } };

        } catch (error) {
            // Catches and handles any errors during the function execution.
            return {
                status: 400, // Sets the HTTP status code to 400 indicating a bad request.
                jsonBody: {
                    innerStatusCode: error.statusCode || error.code, // Includes the specific error code from the caught exception.
                    error: error.details || error.message // Includes a detailed error message.
                }
            };
        }
    }
});
