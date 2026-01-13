document.addEventListener('DOMContentLoaded', function() {
    const statusDiv = document.getElementById('status');

    chrome.storage.local.get(['fidelity_orders', 'fidelity_historys'], function(result) {
        if (chrome.runtime.lastError) {
            statusDiv.textContent = "Storage error";
            statusDiv.className = "error";
            return;
        }

        const orders = result.fidelity_orders || [];
        const historys = result.fidelity_historys || [];

        if (orders.length === 0 && historys.length === 0) {
            statusDiv.innerHTML = "No data yet.<br>Refresh your Activity page.";
            return;
        }

        // Filter options only
        const optionOrders = orders.filter(o => o.isOption);
        const optionHistorys = historys.filter(h => {
            const hasOptionSymbol = h.symbol && h.symbol.match(/[CP][\d.]+$/);
            const desc = (h.description || '').toUpperCase();
            const hasOptionDesc = desc.includes('PUT') || desc.includes('CALL') || desc.includes('OPENING TRANSACTION') || desc.includes('CLOSING TRANSACTION');
            return hasOptionSymbol || hasOptionDesc;
        });

        const total = optionOrders.length + optionHistorys.length;

        // Show ready status
        statusDiv.textContent = `Ready - ${total} trades found`;
        statusDiv.className = "ready";

        // Navigate to dashboard after brief delay
        setTimeout(() => {
            statusDiv.textContent = "Opening dashboard...";
            chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
        }, 500);
    });
});
