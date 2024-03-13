// Function to create filter expressions in OData syntax based on a list of filters and facet configurations
const createFilterExpression = (filterList, facets) => {
    let i = 0;
    let filterExpressions = [];

    // Iterate through the list of filters
    while (i < filterList.length) {
        let field = filterList[i].field; // The field to filter on
        let value = filterList[i].value; // The value to filter by

        // Check if the field is marked as an array type in facets configuration
        if (facets[field] === 'array') {
            // For array fields, use the OData syntax for collections
            filterExpressions.push(`${field}/any(t: search.in(t, '${value}', ','))`);
        } else {
            // For string fields, use the OData syntax for equality
            filterExpressions.push(`${field} eq '${value}'`);
        }
        i += 1;
    }

    // Join all individual filter expressions with 'and' to form a combined OData filter expression
    return filterExpressions.join(' and ');
}

// Function to read and parse facets configuration from a string, marking the type of each facet
const readFacets = (facetString) => {
    // Return early if facetString is not provided
    if(!facetString) return;

    // Split the facetString by comma to process each facet individually
    let facets = facetString.split(",");
    let output = {};
    // Iterate over each facet string
    facets.forEach(function (f) {
        // If the facet ends with an '*', it's considered an array type
        if (f.indexOf('*') > -1) {
            // Remove '*' and mark this facet as an array in the output
            output[f.replace('*', '')] = 'array';
        } else {
            // Otherwise, mark this facet as a string
            output[f] = 'string';
        }
    })

    // Return the parsed facets with their types
    return output;
}

// Export the utility functions for external use
module.exports = {
    createFilterExpression,
    readFacets
}
