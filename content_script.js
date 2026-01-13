// Inject script
const s = document.createElement('script');
s.src = chrome.runtime.getURL('injected.js');
s.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(s);

// Listen for data and store it
window.addEventListener("FIDELITY_DATA", function(event) {
    const { orders, historys } = event.detail;
    console.log("Storing orders:", orders?.length, "historys:", historys?.length);

    chrome.storage.local.set({
        fidelity_orders: orders,
        fidelity_historys: historys
    });
});
