// Import necessary modules. Azure Functions for creating serverless applications, configuration settings,
// custom logic for reading facets and creating filter expressions, and Azure Cognitive Search SDK for interacting with the search service.
const { app } = require('@azure/functions');
const { CONFIG } = require("../lib/config");
const { readFacets, createFilterExpression } = require('../lib/azure-cognitive-search');
const { SearchClient, AzureKeyCredential } = require("@azure/search-documents");

// Initialize a SearchClient to communicate with Azure Cognitive Search service, using settings from the configuration file.
const client = new SearchClient(
    `https://` + CONFIG.SearchServiceName + `.search.windows.net/`, // URL to Azure Cognitive Search service
    CONFIG.SearchIndexName, // Name of the search index to query
    new AzureKeyCredential(CONFIG.SearchApiQueryKey) // API key for authentication
);

// Define a new HTTP-triggered function named 'search' that listens for POST requests. No authentication is required.
app.http('search', {
    methods: ['POST'], // Accept POST requests only
    authLevel: 'anonymous', // No authentication required
    handler: async (request, context) => {
        // Log the incoming request URL
        context.log(`Search request for url "${request.url}"`);

        try {
            // Parse the JSON body of the incoming request
            const body = await request.json();
            console.log(body);

            // Extract search query parameters from the request body, with default values if not provided
            let q = body.q || "*"; // Search text, default is "*" to match all documents
            const top = body.top || 5; // Number of results to return, default is 5
            const skip = parseInt(body.skip || 0); // Number of results to skip, for pagination, default is 0
            const filters = body.filters || undefined; // Filter conditions
            const facets = readFacets(CONFIG.SearchFacets); // Retrieve facets configuration

            // Extract facet names from the facets configuration
            const facetNames = Object.keys(facets);
            console.log(facetNames);

            // Generate a filter expression if filters and facets are provided
            const filtersExpression = (filters && facets) ? createFilterExpression(filters, facets) : undefined;
            console.log(filtersExpression)

            // Create search options for the query, including pagination and filtering settings
            let searchOptions = {
                top: top,
                skip: skip,
                includeTotalCount: true, // Request total count of matching documents for pagination
                facets: facetNames, // Facet fields to include in the response
                filter: filtersExpression // Filter expression to apply to the query
            };
            console.log(searchOptions);

            // Execute the search query with the specified options
            const searchResults = await client.search(q, searchOptions);
            console.log(searchResults);

            // Collect search results for output
            const output = [];
            for await (const result of searchResults.results) {
                output.push(result); // Aggregate results
            }
            console.log(searchResults)

            // Log the total count of matching documents
            context.log(searchResults.count);

            // Return search results and related metadata as a JSON response
            return {
                headers: {
                    "Content-type": "application/json"
                },
                jsonBody: {
                    count: searchResults.count, // Total number of matching documents
                    results: output, // List of search results
                    resultsCount: output.length, // Number of results returned in this response
                    facets: searchResults.facets, // Facet information
                    q, // Echo the search query
                    top, // Echo the number of results requested
                    skip, // Echo the number of results skipped
                    filters: filters || '' // Echo the filters applied
                }
            };

        } catch (error) {
            // Return an error response if an exception occurs
            return {
                status: 500, // Internal server error status code
                jsonBody: {
                    innerStatusCode: error.statusCode || error.code, // Error code
                    error: error.details || error.message, // Error message
                    stack: error.stack // Stack trace for debugging
                }
            }
        }
    }
});
