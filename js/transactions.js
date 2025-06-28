// Store transactions in localStorage
const STORAGE_KEY = 'transactions';

class TransactionManager {
    constructor() {
        this.transactions = this.loadTransactions();
        this.initializeEventListeners();
        // Initialize charts with existing data
        this.updateCharts();
    }

    // Load transactions from localStorage
    loadTransactions() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    // Save transactions to localStorage
    saveTransactions() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.transactions));
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // We'll add new give functionality here later
    }

    // Update the Recent Transactions UI
    updateUI() {
        const transactionList = document.querySelector('.transaction-list');
        const recentTransactions = this.transactions.slice(0, 5);

        transactionList.innerHTML = recentTransactions.map(transaction => {
            const isGive = transaction.type === 'give';
            const isTake = transaction.type === 'take';
            
            return `
                <div class="transaction-card ${transaction.type}">
                    <div class="transaction-info">
                        <h4>${transaction.personName || 'Split Transaction'}</h4>
                        <p class="description">${transaction.description || 'No description'}</p>
                        <span class="date">${new Date(transaction.date).toLocaleDateString()}</span>
                    </div>
                    <div class="transaction-amount">
                        <span class="amount">₹${transaction.amount}</span>
                        <span class="status">${isGive ? 'Given' : isTake ? 'Taken' : 'Split'}</span>
                    </div>
                </div>
            `;
        }).join('');

        this.updateSummary();
    }

    // Update the summary cards at the top
    updateSummary() {
        const given = this.transactions
            .filter(t => t.type === 'give')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const taken = this.transactions
            .filter(t => t.type === 'take')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const netBalance = given - taken;

        document.querySelector('.summary-card:nth-child(1) .amount').textContent = `₹${given}`;
        document.querySelector('.summary-card:nth-child(2) .amount').textContent = `₹${taken}`;
        
        const netBalanceElement = document.querySelector('.summary-card:nth-child(3) .amount');
        netBalanceElement.textContent = `₹${Math.abs(netBalance)}`;
        netBalanceElement.className = `amount ${netBalance >= 0 ? 'positive' : 'negative'}`;
    }

    getMonthlyData() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const currentMonth = new Date().getMonth();
        
        // Get last 6 months
        const monthsToShow = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
        
        const monthlyGiven = new Array(monthsToShow.length).fill(0);
        const monthlyTaken = new Array(monthsToShow.length).fill(0);
        const monthlyNet = new Array(monthsToShow.length).fill(0);

        this.transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            const monthIndex = monthsToShow.indexOf(months[transactionDate.getMonth()]);
            
            if (monthIndex !== -1) {
                const amount = Number(transaction.amount);
                if (transaction.type === 'give') {
                    monthlyGiven[monthIndex] += amount;
                    monthlyNet[monthIndex] += amount;
                } else if (transaction.type === 'take') {
                    monthlyTaken[monthIndex] += amount;
                    monthlyNet[monthIndex] -= amount;
                }
            }
        });

        return {
            labels: monthsToShow,
            given: monthlyGiven,
            taken: monthlyTaken,
            net: monthlyNet
        };
    }

    getDailyData() {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dailyGiven = new Array(7).fill(0);
        const dailyTaken = new Array(7).fill(0);

        // Get transactions from the last 7 days
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        this.transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date);
            if (transactionDate >= oneWeekAgo) {
                // Fix: Convert to 0-6 range where 0 is Monday
                const dayIndex = (transactionDate.getDay() + 6) % 7;
                const amount = Number(transaction.amount);
                
                if (transaction.type === 'give') {
                    dailyGiven[dayIndex] += amount;
                } else if (transaction.type === 'take') {
                    dailyTaken[dayIndex] += amount;
                }
            }
        });

        return {
            labels: days,
            given: dailyGiven,
            taken: dailyTaken
        };
    }

    updateCharts() {
        const monthlyData = this.getMonthlyData();
        const dailyData = this.getDailyData();

        // Update Monthly Trend Chart
        if (window.monthlyTrendChart) {
            window.monthlyTrendChart.data.labels = monthlyData.labels;
            window.monthlyTrendChart.data.datasets[0].data = monthlyData.net;
            window.monthlyTrendChart.update();
        }

        // Update Daily Expenses Chart
        if (window.dailyExpensesChart) {
            window.dailyExpensesChart.data.labels = dailyData.labels;
            window.dailyExpensesChart.data.datasets[0].data = dailyData.given;
            window.dailyExpensesChart.data.datasets[1].data = dailyData.taken;
            window.dailyExpensesChart.update();
        }
    }

    addTransaction(type, data) {
        const transaction = {
            id: Date.now(),
            type,
            ...data,
            timestamp: new Date().toISOString()
        };
        this.transactions.unshift(transaction);
        this.saveTransactions();
        this.updateUI();
        this.updateCharts();
    }
}

// Initialize transaction manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.transactionManager = new TransactionManager();
    window.transactionManager.updateUI();
}); 