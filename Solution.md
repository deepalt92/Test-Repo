1. **Refactor blocking I/O** 
    - `src/routes/items.js` uses `fs.readFileSync`. Replace with non‑blocking async operations.

    Answer - I made the *readData()* function asynchronous using async, await (standard way of making functions asynchronus). This alows Node to handle other tasks while the promise is waiting to be resolved. Thus, the I/O is made non-blocking.

2. **Performance**  
   - `GET /api/stats` recalculates stats on every request. Cache results, watch file changes, or introduce a smarter strategy.

   Answer -  I cache the stats in-memory. There is an initial cache load using the *loadAndCacheStats()* function when the module is loaded. Whenever the endpoint is hit, if the cache exists, the cached response is returned.
   ```
    if (cachedStats) {
    res.json(cachedStats);  // Immediate response
    }
   ```  
   Otherwise, in case of a cache miss the stats are recalculated.
    ```
        else {
        fs.readFile(DATA_PATH, (err, raw) => {
            // Recalculate and update cache
            const stats = recalculateStats(items);
            cachedStats = stats;
            res.json(stats);
        });
        }
    ```
   Also, this method auto updates the cache on file changes (i.e., if items.json changes).
   ```
    fs.watchFile(DATA_PATH, loadAndCacheStats);
   ```

   Insights - The cache startegy is effective for data that does not change frequently, and are accessed often. It reduces I/O as the data is fetched from memory. This helps improve performance.

3. **Testing**  
   - Add **unit tests** (Jest) for items routes (happy path + error cases).

   Answer - Unit test cases are added to public/tests/items.test.js. They can be run by going to the backend/ folder and executing
   ```
    npm run test
   ```
   jest is used for the test cases and the file writes are mocked. The response from the API calls in items.js are verified against expected data. If the response is successful, we check if the status code is 200 or 201. Otherwise, we check for 404, and 500 status codes.

### 💻 Frontend (React)

1. **Memory Leak**  
   - `Items.js` leaks memory if the component unmounts before fetch completes. Fix it.

   Answer - An abort controller signal is sent to the fetch call if the component unmounts.
   ```
        const abortController = new AbortController();

        const fetchData = async () => {
        try {
            await fetchItems(abortController.signal, currentPage, pagination.limit, searchQuery);
        } catch (error) {
            if (!error.name === 'AbortError') {
            console.error(error);
            }
        }
        };
  
   ```

    This prevents the fetchItems function from waiting till the fetch call returns. Thus, it does not wait for the response items, avoiding a memory leak.

2. **Pagination & Search**  
   - Implement paginated list with server‑side search (`q` param). Contribute to both client and server.

   The backend handles pagination through query parameters and slicing:
   ```
        // Query parameters
        const { page = 1, limit = 10, q } = req.query;

        // Calculate pagination indices
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const total = results.length;

        // Slice results for current page
        results = results.slice(startIndex, endIndex);

        // Return paginated response
        res.json({
        items: results,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
            hasMore: endIndex < total
        }
        });

   ```

   In the front-end, the below handles page changes:

   ```
        const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        };

   ```

   The below handles searches:
   ```
        const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

   ```
   
   And based on the search the below fetches data when the page changes:

   ```
   
    useEffect(() => {
        const abortController = new AbortController();

        const fetchData = async () => {
        try {
            await fetchItems(abortController.signal, currentPage, pagination.limit, searchQuery);
        } catch (error) {
            if (!error.name === 'AbortError') {
            console.error(error);
            }
        }
        };

        fetchData();

        return () => {
        abortController.abort();
        };
    }, [fetchItems, currentPage, pagination.limit, searchQuery]);

    ```
    The following react components handle pagination:

    ```
            {pagination.totalPages > 1 && (
            <div className="pagination">
            <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                Previous
            </button>
            
            <span>
                Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasMore}
            >
                Next
            </button>
            </div>
        )}
        </div>
    );

    ```

    Advantages of pagination - Reduces data transfer, improves performance, handles large datasets efficiently

3. **Performance**  
   - The list can grow large. Integrate **virtualization** (e.g., `react-window`) to keep UI smooth.

    Answer - I use the FixedSizeList from *react-window* to render a list with limited DOM nodes. This is done by limiting the list items to the viewport and fixing the viewport size.
    ```
        <List
        height={400}         // Viewport height
        itemCount={items.length}
        itemSize={50}        // Each item height
        width="100%"
        >
        {Row}
        </List>
    ```
