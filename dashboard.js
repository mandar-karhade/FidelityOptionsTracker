// Dashboard - Analytics and Charts

let allTrades = [];

document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['fidelity_orders', 'fidelity_historys'], function(result) {
        console.log("Dashboard loaded, storage result:", result);

        const orders = result.fidelity_orders || [];
        const historys = result.fidelity_historys || [];

        console.log("Orders:", orders.length, "Historys:", historys.length);

        // Filter to options only
        const optionOrders = orders.filter(o => o.isOption);
        const optionHistorys = historys.filter(h => {
            const hasOptionSymbol = h.symbol && h.symbol.match(/[CP][\d.]+$/);
            const desc = (h.description || '').toUpperCase();
            const hasOptionDesc = desc.includes('PUT') || desc.includes('CALL') ||
                                  desc.includes('OPENING TRANSACTION') || desc.includes('CLOSING TRANSACTION');
            return hasOptionSymbol || hasOptionDesc;
        });

        console.log("Filtered - optionOrders:", optionOrders.length, "optionHistorys:", optionHistorys.length);

        // Process all trades into unified format
        allTrades = processAllTrades(optionOrders, optionHistorys);
        console.log("Processed trades:", allTrades);

        if (allTrades.length === 0) {
            document.getElementById('loading').textContent = 'No option trades found. Go to Fidelity Activity page and refresh.';
            return;
        }

        // Calculate metrics (excludes cancelled)
        const activeTrades = allTrades.filter(t => !isCancelled(t));
        const metrics = calculateMetrics(activeTrades);

        // Render dashboard
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';

        renderSummaryCards(metrics);
        renderCharts(activeTrades, metrics);
        renderTable(allTrades, false);

        // Filter toggles
        const aggregateCheckbox = document.getElementById('aggregateView');
        const cancelledCheckbox = document.getElementById('showCancelled');

        function updateTable() {
            renderTable(allTrades, cancelledCheckbox.checked, aggregateCheckbox.checked);
        }

        aggregateCheckbox.addEventListener('change', updateTable);
        cancelledCheckbox.addEventListener('change', updateTable);

        // Download button
        document.getElementById('downloadBtn').addEventListener('click', function() {
            const showCancelled = cancelledCheckbox.checked;
            const aggregate = aggregateCheckbox.checked;
            downloadCSV(allTrades, showCancelled, aggregate);
        });
    });
});

function downloadCSV(trades, showCancelled, aggregate) {
    let data = showCancelled ? trades : trades.filter(t => !isCancelled(t));
    if (aggregate) {
        data = aggregateTrades(data);
    }

    const headers = ['Date', 'Ticker', 'Type', 'Action', 'Expiry', 'Qty', 'Price', 'P&L', 'Status'];
    const rows = data.map(t => [
        t.date,
        t.ticker,
        t.type,
        t.action,
        t.exp,
        t.qty,
        t.price.toFixed(2),
        t.amount.toFixed(2),
        isCancelled(t) ? 'Cancelled' : 'Executed'
    ]);

    const csv = [
        headers.join(','),
        ...rows.map(r => r.map(f => `"${f}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `options_trades_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function isCancelled(trade) {
    const status = (trade.status || '').toLowerCase();
    return status.includes('cancel');
}

function normalizeAction(action) {
    if (!action) return '';
    // Remove Put/Call suffix - "Sell to Open Put" -> "Sell to Open"
    return action.replace(/\s+(Put|Call)$/i, '');
}

function aggregateTrades(trades) {
    const groups = {};

    trades.forEach(trade => {
        // Group key: ticker + date + expiry + action + type
        const key = `${trade.ticker}|${trade.date}|${trade.exp}|${trade.action}|${trade.type}`;

        if (!groups[key]) {
            groups[key] = {
                date: trade.date,
                dateObj: trade.dateObj,
                action: trade.action,
                ticker: trade.ticker,
                exp: trade.exp,
                strike: trade.strike,
                type: trade.type,
                qty: 0,
                totalPrice: 0,
                amount: 0,
                commission: 0,
                fees: 0,
                tradeCount: 0,
                status: trade.status,
                source: trade.source
            };
        }

        groups[key].qty += trade.qty;
        groups[key].totalPrice += trade.price * trade.qty;
        groups[key].amount += trade.amount;
        groups[key].commission += trade.commission;
        groups[key].fees += trade.fees;
        groups[key].tradeCount++;
    });

    // Calculate average price and convert to array
    return Object.values(groups).map(g => ({
        ...g,
        price: g.qty > 0 ? g.totalPrice / g.qty : 0
    })).sort((a, b) => b.dateObj - a.dateObj);
}

function getDetail(item, key) {
    const found = item.detailItems?.find(i => i.key === key);
    return found ? found.value : '';
}

function parseSymbol(symbol) {
    if (!symbol) return { ticker: '', exp: '', type: '', strike: '' };
    const match = symbol.match(/^-?([A-Z]+)(\d{6})([CP])([\d.]+)$/);
    if (!match) return { ticker: symbol, exp: '', type: '', strike: '' };

    const [, ticker, dateStr, optType, strike] = match;
    return {
        ticker,
        exp: `${dateStr.slice(2,4)}/${dateStr.slice(4,6)}/20${dateStr.slice(0,2)}`,
        type: optType === 'C' ? 'Call' : 'Put',
        strike
    };
}

function parseAmount(amountStr) {
    if (!amountStr || amountStr === '--') return 0;
    return parseFloat(amountStr.replace(/[$,+]/g, '')) || 0;
}

function parseDate(dateStr) {
    if (!dateStr) return new Date();
    // Handle "Jan-13-2026" or "13 Jan 2026" formats
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
}

function processAllTrades(orders, historys) {
    const trades = [];

    // Process pending orders
    orders.forEach(order => {
        const parsed = parseSymbol(order.briefSymbol);
        const rawAction = getDetail(order, 'Action');
        // Normalize action - remove Put/Call suffix to match history format
        const action = normalizeAction(rawAction);
        const qty = getDetail(order, 'Quantity').replace(/[^0-9]/g, '');
        const orderType = getDetail(order, 'Order Type');
        const priceMatch = orderType.match(/\$([\d.]+)/);

        trades.push({
            date: order.date || '',
            dateObj: parseDate(order.date),
            action: action,
            ticker: parsed.ticker,
            exp: parsed.exp,
            strike: parsed.strike,
            type: parsed.type,
            qty: parseInt(qty) || 0,
            price: priceMatch ? parseFloat(priceMatch[1]) : 0,
            commission: 0,
            fees: 0,
            amount: parseAmount(order.amount),
            status: order.status || '',
            source: 'Pending'
        });
    });

    // Process history
    historys.forEach(h => {
        const parsed = parseSymbol(h.symbol);

        let action = '';
        const desc = h.description || '';
        if (desc.includes('SOLD OPENING')) action = 'Sell to Open';
        else if (desc.includes('SOLD CLOSING')) action = 'Sell to Close';
        else if (desc.includes('BOUGHT OPENING')) action = 'Buy to Open';
        else if (desc.includes('BOUGHT CLOSING')) action = 'Buy to Close';

        const contracts = parseFloat(getDetail(h, 'Contracts').replace(/[^0-9.]/g, '')) || 0;
        const price = parseFloat(getDetail(h, 'Price').replace(/[$,]/g, '')) || 0;
        const commission = parseFloat(getDetail(h, 'Commission').replace(/[$,]/g, '')) || 0;
        const fees = parseFloat(getDetail(h, 'Fees').replace(/[$,]/g, '')) || 0;

        trades.push({
            date: h.date || '',
            dateObj: parseDate(h.date),
            action: action,
            ticker: parsed.ticker,
            exp: parsed.exp,
            strike: parsed.strike,
            type: parsed.type,
            qty: Math.abs(contracts),
            price: price,
            commission: commission,
            fees: fees,
            amount: parseAmount(h.amount),
            status: h.cashBalance || 'Executed',
            source: 'History'
        });
    });

    // Sort by date descending
    trades.sort((a, b) => b.dateObj - a.dateObj);
    return trades;
}

function calculateMetrics(trades) {
    let totalPnL = 0;
    let premiumCollected = 0;
    let premiumPaid = 0;
    let totalFees = 0;
    let wins = 0;

    const byTicker = {};
    const byAction = {};
    const byType = { Put: 0, Call: 0 };
    const pnlOverTime = [];

    // Only count executed trades for P&L
    const executedTrades = trades.filter(t => t.source === 'History');

    executedTrades.forEach(trade => {
        totalPnL += trade.amount;
        totalFees += trade.commission + trade.fees;

        if (trade.amount > 0) {
            wins++;
            premiumCollected += trade.amount;
        } else {
            premiumPaid += Math.abs(trade.amount);
        }

        // By ticker
        byTicker[trade.ticker] = (byTicker[trade.ticker] || 0) + trade.amount;

        // By action
        if (trade.action) {
            byAction[trade.action] = (byAction[trade.action] || 0) + 1;
        }

        // By type
        if (trade.type === 'Put' || trade.type === 'Call') {
            byType[trade.type]++;
        }
    });

    // Calculate cumulative P&L over time (chronological order)
    const sortedByDate = [...executedTrades].sort((a, b) => a.dateObj - b.dateObj);

    // Add zero starting point before first trade
    if (sortedByDate.length > 0) {
        const firstDate = sortedByDate[0].dateObj;
        const startDate = new Date(firstDate);
        startDate.setDate(startDate.getDate() - 1);
        pnlOverTime.push({
            date: 'Start',
            ticker: '',
            amount: 0,
            cumulative: 0
        });
    }

    let cumulative = 0;
    sortedByDate.forEach((trade) => {
        cumulative += trade.amount;
        pnlOverTime.push({
            date: trade.date,
            ticker: trade.ticker,
            amount: trade.amount,
            cumulative: cumulative
        });
    });

    const winRate = executedTrades.length > 0 ? (wins / executedTrades.length) * 100 : 0;

    return {
        totalPnL,
        totalTrades: trades.length,
        executedTrades: executedTrades.length,
        winRate,
        premiumCollected,
        premiumPaid,
        totalFees,
        byTicker,
        byAction,
        byType,
        pnlOverTime
    };
}

function formatCurrency(amount) {
    const prefix = amount >= 0 ? '+$' : '-$';
    return prefix + Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderSummaryCards(metrics) {
    const pnlEl = document.getElementById('totalPnL');
    pnlEl.textContent = formatCurrency(metrics.totalPnL);
    pnlEl.className = 'card-value ' + (metrics.totalPnL >= 0 ? 'positive' : 'negative');

    document.getElementById('totalTrades').textContent = metrics.totalTrades;
    document.getElementById('winRate').textContent = metrics.winRate.toFixed(1) + '%';
    document.getElementById('premiumCollected').textContent = '+$' + metrics.premiumCollected.toLocaleString('en-US', { minimumFractionDigits: 2 });
    document.getElementById('totalFees').textContent = '-$' + metrics.totalFees.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function renderCharts(trades, metrics) {
    const chartColors = {
        green: '#22c55e',
        red: '#ef4444',
        gray: '#a1a1aa',
        muted: '#71717a',
        amber: '#f59e0b',
        teal: '#14b8a6'
    };

    // P&L Over Time Chart
    if (metrics.pnlOverTime.length > 1) {
        // Update chart title with first trade date
        const firstTradeDate = metrics.pnlOverTime[1]?.date || '';
        document.getElementById('pnlChartTitle').textContent = `Cumulative P&L since ${firstTradeDate}`;

        const pnlCtx = document.getElementById('pnlChart').getContext('2d');
        const pnlData = metrics.pnlOverTime.map(p => p.cumulative);
        const currentPnL = pnlData[pnlData.length - 1] || 0;

        // Create gradient based on performance
        const gradient = pnlCtx.createLinearGradient(0, 0, 0, 250);
        if (currentPnL >= 0) {
            gradient.addColorStop(0, 'rgba(34, 197, 94, 0.2)');
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0.02)');
        } else {
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.02)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.2)');
        }

        new Chart(pnlCtx, {
            type: 'line',
            data: {
                labels: metrics.pnlOverTime.map(p => p.date),
                datasets: [{
                    label: 'Cumulative P&L',
                    data: pnlData,
                    borderColor: currentPnL >= 0 ? chartColors.green : chartColors.red,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: pnlData.map(v => v >= 0 ? chartColors.green : chartColors.red)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: ctx => {
                                const point = metrics.pnlOverTime[ctx[0].dataIndex];
                                return point.date;
                            },
                            label: ctx => {
                                const point = metrics.pnlOverTime[ctx.dataIndex];
                                const lines = [];
                                if (point.ticker) {
                                    const amt = point.amount;
                                    lines.push(`${point.ticker}: ${amt >= 0 ? '+' : '-'}$${Math.abs(amt).toLocaleString()}`);
                                }
                                lines.push(`Cumulative: ${point.cumulative >= 0 ? '+' : '-'}$${Math.abs(point.cumulative).toLocaleString()}`);
                                return lines;
                            }
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: '#71717a' }, grid: { color: '#27272a' } },
                    y: {
                        min: Math.min(0, ...pnlData),
                        max: Math.max(0, ...pnlData) * 1.1,
                        ticks: {
                            color: '#71717a',
                            callback: v => (v >= 0 ? '+$' : '-$') + Math.abs(v).toLocaleString()
                        },
                        grid: { color: '#27272a' }
                    }
                }
            }
        });
    }

    // P&L by Ticker Chart
    const tickers = Object.keys(metrics.byTicker);
    const tickerValues = Object.values(metrics.byTicker);
    const tickerColors = tickerValues.map(v => v >= 0 ? chartColors.green : chartColors.red);

    new Chart(document.getElementById('tickerChart'), {
        type: 'bar',
        data: {
            labels: tickers,
            datasets: [{
                label: 'P&L',
                data: tickerValues,
                backgroundColor: tickerColors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#71717a' }, grid: { color: '#27272a' } },
                y: { ticks: { color: '#71717a', callback: v => '$' + v }, grid: { color: '#27272a' } }
            }
        }
    });

    // Action Stats - simple text
    const actionStats = document.getElementById('actionStats');
    const actionOrder = ['Sell to Open', 'Sell to Close', 'Buy to Open', 'Buy to Close'];
    actionOrder.forEach(action => {
        const count = metrics.byAction[action] || 0;
        if (count > 0) {
            const colorClass = action.startsWith('Sell') ? 'sell' : 'buy';
            actionStats.innerHTML += `
                <div class="stat-row">
                    <span class="stat-label">${action}</span>
                    <span class="stat-value ${colorClass}">${count}</span>
                </div>
            `;
        }
    });

    // Type Stats - simple text
    const typeStats = document.getElementById('typeStats');
    const totalOptions = metrics.byType.Put + metrics.byType.Call;
    const putPct = totalOptions > 0 ? ((metrics.byType.Put / totalOptions) * 100).toFixed(0) : 0;
    const callPct = totalOptions > 0 ? ((metrics.byType.Call / totalOptions) * 100).toFixed(0) : 0;

    typeStats.innerHTML = `
        <div class="stat-row">
            <span class="stat-label">Puts</span>
            <span class="stat-value put">${metrics.byType.Put} (${putPct}%)</span>
        </div>
        <div class="stat-row">
            <span class="stat-label">Calls</span>
            <span class="stat-value call">${metrics.byType.Call} (${callPct}%)</span>
        </div>
    `;
}

function renderTable(trades, showCancelled, aggregate) {
    const tbody = document.getElementById('tradesTable');
    tbody.innerHTML = '';

    let filteredTrades = showCancelled ? trades : trades.filter(t => !isCancelled(t));

    if (aggregate) {
        filteredTrades = aggregateTrades(filteredTrades);
    }

    filteredTrades.forEach(trade => {
        const tr = document.createElement('tr');

        const actionClass = trade.action.includes('Sell') ? 'tag-sell' : 'tag-buy';
        const typeClass = trade.type === 'Put' ? 'tag-put' : 'tag-call';
        const amountClass = trade.amount >= 0 ? 'amount-positive' : 'amount-negative';
        const cancelled = isCancelled(trade);

        const qtyDisplay = aggregate && trade.tradeCount > 1
            ? `${trade.qty} <span class="trade-count">(${trade.tradeCount})</span>`
            : trade.qty;

        tr.innerHTML = `
            <td>${trade.date}</td>
            <td><strong>${trade.ticker}</strong></td>
            <td><span class="tag ${typeClass}">${trade.type}</span></td>
            <td><span class="tag ${actionClass}">${trade.action || '-'}</span></td>
            <td>${trade.exp}</td>
            <td>${qtyDisplay}</td>
            <td>$${trade.price.toFixed(2)}</td>
            <td class="${amountClass}">${trade.amount !== 0 ? formatCurrency(trade.amount) : '-'}</td>
            <td>${cancelled ? '<span class="tag tag-cancelled">Cancelled</span>' : ''}</td>
        `;

        tbody.appendChild(tr);
    });
}
