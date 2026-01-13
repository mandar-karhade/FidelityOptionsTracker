// Intercept GraphQL and capture orders + historys
(function() {
    console.log("%c Fidelity Exporter: Active ", "background: blue; color: white");

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
        const [resource] = args;
        const url = typeof resource === 'string' ? resource : resource?.url || '';

        if (url.includes('webactivity/api/graphql')) {
            const response = await originalFetch(...args);
            const clone = response.clone();

            try {
                const data = await clone.json();
                const txn = data?.data?.getTransactions;

                if (txn) {
                    const orders = txn.orders || [];
                    const historys = txn.historys || [];

                    console.log("%c Orders: " + orders.length + ", Historys: " + historys.length, "background: green; color: white");

                    // Log first history item to see structure
                    if (historys.length > 0) {
                        console.log("First history item:", JSON.stringify(historys[0], null, 2));
                    }

                    window.dispatchEvent(new CustomEvent("FIDELITY_DATA", {
                        detail: { orders, historys }
                    }));
                }
            } catch (err) {
                console.log("Parse error:", err);
            }

            return response;
        }

        return originalFetch(...args);
    };
})();
