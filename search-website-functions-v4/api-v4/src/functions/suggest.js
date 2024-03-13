// Import required modules from the Azure Functions and Azure Cognitive Search SDKs
const { app } = require('@azure/functions');
const { SearchClient, AzureKeyCredential } = require("@azure/search-documents");
// Import the configuration settings for the Azure Search service
const { CONFIG } = require("../lib/config");

// Initialize the SearchClient with the search service URL, index name, and API key from the configuration
const client = new SearchClient(
    `https://` + CONFIG.SearchServiceName + `.search.windows.net/`, // Constructs the Azure Search Service URL
    CONFIG.SearchIndexName, // Specifies which search index to use
    new AzureKeyCredential(CONFIG.SearchApiQueryKey) // Provides the API key for authentication
);

// Define a new HTTP triggered Azure Function named 'suggest'
app.http('suggest', {
    methods: ['POST'], // Sets the function to respond to POST requests
    authLevel: 'anonymous', // No authentication required to access this function
    handler: async (request, context) => { // The main function handler
        context.log(`Suggester request for url "${request.url}"`); // Logs the request URL for debugging
        try {
            const body = await request.json(); // Parses the JSON body of the request
            console.log(`suggest body ${body}`); // Logs the request body

            let q = body.q; // Extracts the query parameter from the request body
            console.log(`suggest q ${q}`);

            const top = body.top; // Extracts the 'top' parameter to limit the number of suggestions
            console.log(`suggest top ${top}`);

            const suggester = body.suggester; // Extracts the suggester name from the request body
            console.log(`suggest suggester ${suggester}`);

            // Validates the presence of required parameters
            if(!body || !q || !top || !suggester){
                console.log(`No suggester found in body`);
                return {
                    status: 404,
                    body: "No suggester found" // Returns an error if any required field is missing
                }
            }

            // Fetches suggestions based on the provided query, suggester, and limit (top)
            const suggestions = await client.suggest(q, suggester, { top: parseInt(top), fuzzy: true });

            context.log(suggestions); // Logs the received suggestions for debugging

            // Returns the suggestions and the input parameters as a JSON response
            return {
                headers: {
                    "Content-type": "application/json"
                },
                jsonBody: { 
                    suggestions: suggestions.results, // The suggestions from Azure Cognitive Search
                    q, // Echoes back the query term
                    top, // Echoes back the number of suggestions requested
                    suggester // Echoes back the suggester used
                }
            }
        } catch (error) {
            // Handles any errors in the try block and returns a structured error response
            return {
                status: 400,
                jsonBody: {
                    innerStatusCode: error.statusCode || error.code, // Includes the specific error code
                    error: error.details || error.message // Includes the detailed error message
                }
            }
        }
    }
});
